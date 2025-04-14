// src/models/user.rs
use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use jsonwebtoken::{encode, EncodingKey, Header};
use chrono::{Utc, Duration};
use std::env;
use bcrypt::verify;

#[derive(Serialize, Deserialize, Clone)]
pub struct User {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub username: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub email: String,
    pub rating: i32,
    #[serde(default)]
    pub is_guest: bool,
}

#[derive(Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,         // Subject (user ID)
    pub username: String,    // Username
    pub is_guest: bool,      // Guest flag
    pub exp: usize,          // Expiration time
    pub iat: usize,          // Issued at
}

impl User {
    pub fn verify_password(&self, password: &str) -> bool {
        verify(password, &self.password_hash).unwrap_or(false)
    }

    pub fn generate_token(&self) -> Result<String, jsonwebtoken::errors::Error> {
        let id = self.id.as_ref()
            .ok_or_else(|| jsonwebtoken::errors::Error::from(jsonwebtoken::errors::ErrorKind::InvalidToken))?;
            
        let now = Utc::now();
        let expires_at = now + Duration::hours(24);
        
        let claims = Claims {
            sub: id.to_hex(),
            username: self.username.clone(),
            is_guest: self.is_guest,
            exp: expires_at.timestamp() as usize,
            iat: now.timestamp() as usize,
        };
        
        let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "your_jwt_secret_key".to_string());
        
        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(secret.as_bytes()),
        )
    }
    
    pub fn new_guest() -> Self {
        let uuid = uuid::Uuid::new_v4().to_string();
        let guest_name = format!("guest_{}", uuid.split('-').next().unwrap_or("user"));
        
        Self {
            id: None,
            username: guest_name,
            password_hash: String::new(), // Will be set by DbConnection::create_guest_user
            email: format!("{}@guest.rustic-knights.com", uuid),
            rating: 1000,
            is_guest: true,
        }
    }
}