// src/main.rs
use actix_web::{web, App, HttpServer};
use actix_web_actors::ws;
mod handlers;
mod models;
mod db;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let db = db::mongodb::connect().await.expect("Failed to connect to MongoDB");
    
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(db.clone()))
            .service(handlers::auth::login)
            .service(handlers::auth::register)
            .service(web::resource("/ws/game/{game_id}").route(web::get().to(handlers::websocket::game_ws)))
            .service(handlers::game::create_game)
            .service(handlers::game::join_game)
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}