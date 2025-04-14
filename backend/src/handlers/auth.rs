// src/handlers/auth.rs
use actix_web::{post, get, web, HttpResponse, Result, Error};
use serde::{Deserialize, Serialize};
use crate::models::user::User;
use crate::db::mongodb::DbConnection;
use log::error;

#[derive(Deserialize)]
pub struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Deserialize, Debug)]
pub struct RegisterRequest {
    username: String,
    password: String,
    email: String,
}

#[derive(Serialize)]
pub struct AuthResponse {
    token: String,
    user_id: String,
    username: String,
    is_guest: bool,
}

// Convert MongoDB errors to Actix errors
fn map_db_err(err: mongodb::error::Error) -> Error {
    error!("Database error: {}", err);
    
    // Check for specific error types
    if err.to_string().contains("Username already exists") {
        return actix_web::error::ErrorConflict("Username already exists");
    }
    
    actix_web::error::ErrorInternalServerError("Database error occurred")
}

#[post("/auth/login")]
pub async fn login(
    db: web::Data<DbConnection>,
    credentials: web::Json<LoginRequest>
) -> Result<HttpResponse, Error> {
    match db.find_user(&credentials.username).await.map_err(|_| {
        actix_web::error::ErrorUnauthorized("User not found")
    })? {
        user => {
            if user.verify_password(&credentials.password) {
                match user.generate_token() {
                    Ok(token) => {
                        let user_id = user.id.map(|id| id.to_hex()).unwrap_or_default();
                        Ok(HttpResponse::Ok().json(AuthResponse {
                            token,
                            user_id,
                            username: user.username,
                            is_guest: user.is_guest,
                        }))
                    },
                    Err(_) => {
                        error!("Failed to generate token");
                        Err(actix_web::error::ErrorInternalServerError("Failed to generate token"))
                    }
                }
            } else {
                Err(actix_web::error::ErrorUnauthorized("Invalid credentials"))
            }
        }
    }
}

#[post("/auth/register")]
pub async fn register(
    db: web::Data<DbConnection>,
    user_data: web::Json<RegisterRequest>,
) -> Result<HttpResponse, Error> {
    let new_user = User {
        id: None,
        username: user_data.username.clone(),
        password_hash: user_data.password.clone(),
        email: user_data.email.clone(),
        rating: 1000,
        is_guest: false,
    };
    
    let user = db.create_user(new_user).await.map_err(map_db_err)?;
    
    match user.generate_token() {
        Ok(token) => {
            let user_id = user.id.map(|id| id.to_hex()).unwrap_or_default();
            Ok(HttpResponse::Created().json(AuthResponse {
                token,
                user_id,
                username: user.username,
                is_guest: user.is_guest,
            }))
        },
        Err(_) => {
            error!("Failed to generate token");
            Err(actix_web::error::ErrorInternalServerError("Failed to generate token"))
        }
    }
}

#[get("/auth/guest")]
pub async fn guest_login(
    db: web::Data<DbConnection>,
) -> Result<HttpResponse, Error> {
    let user = db.create_guest_user().await.map_err(map_db_err)?;
    
    match user.generate_token() {
        Ok(token) => {
            let user_id = user.id.map(|id| id.to_hex()).unwrap_or_default();
            Ok(HttpResponse::Ok().json(AuthResponse {
                token,
                user_id,
                username: user.username,
                is_guest: user.is_guest,
            }))
        },
        Err(_) => {
            error!("Failed to generate token");
            Err(actix_web::error::ErrorInternalServerError("Failed to generate token"))
        }
    }
}