// src/handlers/auth.rs
use actix_web::{post, web, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use crate::models::user::User;
use crate::db::mongodb::DbConnection;

#[derive(Deserialize)]
pub struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Serialize)]
pub struct AuthResponse {
    token: String,
    user_id: String,
}

#[post("/auth/login")]
pub async fn login(
    db: web::Data<DbConnection>,
    credentials: web::Json<LoginRequest>
) -> Result<HttpResponse> {
    // Validate credentials and generate JWT token
    let user = db.find_user(&credentials.username).await?;
    if user.verify_password(&credentials.password) {
        let token = user.generate_token()?;
        Ok(HttpResponse::Ok().json(AuthResponse {
            token,
            user_id: user.id.to_string(),
        }))
    } else {
        Ok(HttpResponse::Unauthorized().finish())
    }
}

#[post("/auth/register")]
pub async fn register(
    db: web::Data<DbConnection>,
    user_data: web::Json<User>,
) -> Result<HttpResponse> {
    // Create new user in database
    let user = db.create_user(user_data.into_inner()).await?;
    Ok(HttpResponse::Created().json(user))
}