// src/main.rs
use actix_web::{web, App, HttpServer, middleware::Logger};
use actix_cors::Cors;
use std::env;
use log::info;

// Import handlers
mod db;
mod models;
mod handlers;

use handlers::auth;
use handlers::game;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize env variables and logger
    dotenv::dotenv().ok();
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    
    // Configuration
    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let server_url = format!("{}:{}", host, port);
    
    info!("Starting server at: {}", server_url);
    
    // Start HTTP server
    HttpServer::new(move || {
        // Configure CORS to allow any origin for testing
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .supports_credentials()
            .max_age(3600);

        // Configure MongoDB connection
        let db_conn = db::mongodb::create_in_memory_db();
            
        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .app_data(web::Data::new(db_conn.clone()))
            // Register all auth endpoints
            .service(auth::login)
            .service(auth::register)
            .service(auth::guest_login)
            // Register all game endpoints 
            .service(game::create_game)
            .service(game::join_game)
    })
    .bind(server_url)?
    .run()
    .await
}