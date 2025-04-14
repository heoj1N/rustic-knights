// src/handlers/middleware.rs
use actix_web::{
    dev::{Service, ServiceRequest, ServiceResponse, Transform, forward_ready},
    Error, HttpMessage,
};
use crate::models::user::Claims;
use futures::future::{ready, LocalBoxFuture, Ready};
use jsonwebtoken::{decode, DecodingKey, Validation};
use std::env;
use std::rc::Rc;
use std::task::{Context, Poll};

pub struct JwtMiddleware;

impl<S, B> Transform<S, ServiceRequest> for JwtMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = JwtMiddlewareService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(JwtMiddlewareService {
            service: Rc::new(service),
        }))
    }
}

pub struct JwtMiddlewareService<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for JwtMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = Rc::clone(&self.service);

        Box::pin(async move {
            // Skip authentication for login, register, and guest endpoints
            let path = req.path();
            if path.contains("/auth/login") || path.contains("/auth/register") || path.contains("/auth/guest") {
                return service.call(req).await;
            }

            let auth_header = req
                .headers()
                .get("Authorization")
                .and_then(|header| header.to_str().ok());

            if let Some(auth) = auth_header {
                if auth.starts_with("Bearer ") {
                    let token = &auth[7..]; // Remove "Bearer " prefix
                    let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "your_jwt_secret_key".to_string());
                    
                    match decode::<Claims>(
                        token,
                        &DecodingKey::from_secret(jwt_secret.as_bytes()),
                        &Validation::default(),
                    ) {
                        Ok(token_data) => {
                            // Store user data in request extensions
                            req.extensions_mut().insert(token_data.claims);
                            return service.call(req).await;
                        }
                        Err(_) => {
                            return service.call(req).await;
                            // If you want to reject invalid tokens:
                            // return Err(actix_web::error::ErrorUnauthorized("Invalid token"));
                        }
                    }
                }
            }

            // Continue without authentication (will be handled at the handler level)
            service.call(req).await
        })
    }
} 