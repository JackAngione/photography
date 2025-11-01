extern crate core;

mod photo_file_ops;

use axum::http::header;
use axum::{Router, routing::get};

use std::fs;
use std::path::Path;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;

#[tokio::main]
async fn main() {
    //STATIC FILE SERVING PATHS
    let images_path = Path::new("./server_files/hdr_images");
    let serve_images = ServeDir::new(images_path);

    // Configure CORS middleware to allow all origins
    let cors = CorsLayer::new()
        .allow_origin(Any) // Allow requests from any origin
        .allow_methods(Any) // Allow all HTTP methods
        .allow_headers(Any) // Allow all HTTP headers
        .expose_headers([
            header::CONTENT_LENGTH,
            header::CONTENT_TYPE,
            header::ACCEPT_RANGES,
        ]);
    // build our application with a single route
    let app = Router::new()
        .route("/", get(|| async { "Hello, World!" }))
        .route("/getPhotoCategories", get(photo_file_ops::get_categories))
        .route(
            "/category/{category}",
            get(photo_file_ops::get_category_photos),
        )
        .nest_service("/photo", serve_images) // Static file route
        .layer(cors);

    // run our app with hyper, listening globally on port xxxx
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
