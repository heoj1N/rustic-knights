use axum::{
    routing::get,
    Router,
    response::Json,
    http::{HeaderValue, Method},
    middleware::from_fn,
};
use tower_http::cors::CorsLayer;
use serde_json;

#[tokio::main]
async fn main() {
    // Add CORS middleware to allow requests from frontend
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:5173".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST])
        .allow_headers(tower_http::cors::Any);

    let app = Router::new()
        .route("/api/health", get(|| async { 
            Json(serde_json::json!({ "status": "ok" }))
        }))
        .layer(cors);

    println!("Server running on http://localhost:3000");
    axum::Server::bind(&"0.0.0.0:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}
