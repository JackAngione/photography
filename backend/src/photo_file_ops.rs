use axum::{Json, extract::Path as axum_path, http::StatusCode};
use rand::rng;
use rand::seq::SliceRandom;
use std::path::Path;

pub(crate) async fn get_categories(req: axum::extract::Request) -> Json<Vec<String>> {
    let path = Path::new("./server_files/hdr_images");
    let mut hdr_images_folder = tokio::fs::read_dir(path).await.unwrap();
    let mut image_files: Vec<String> = Vec::new();
    while let Some(category) = hdr_images_folder.next_entry().await.unwrap() {
        //check if current entry is a folder (category)
        let category_check = match category.file_type().await {
            Ok(file_type) => file_type.is_dir(),
            Err(_) => false, //if this is false, something is wrong with the file lol
        };
        if category_check {
            image_files.push(category.file_name().into_string().unwrap());
        }
    }
    Json(image_files)
}

pub(crate) async fn get_category_photos(
    axum_path(category): axum_path<String>,
) -> Result<Json<Vec<String>>, StatusCode> {
    let pathbuilder = format!("./server_files/hdr_images/{}/high", category);
    let path = Path::new(&pathbuilder);
    //if given invalid category, return NOT FOUND status code
    let mut category_folder = match tokio::fs::read_dir(path).await {
        Ok(dir) => dir,
        Err(_e) => return Err(StatusCode::NOT_FOUND),
    };

    let mut photo_files: Vec<String> = Vec::new();
    while let Some(photo) = category_folder.next_entry().await.unwrap() {
        //check if current entry is a folder (category)
        if photo.file_name() == ".DS_Store" {
            continue;
        }
        photo_files.push(photo.file_name().into_string().unwrap());
    }
    //Shuffle order of images
    let mut rng = rng();
    photo_files.shuffle(&mut rng);
    Ok(Json(photo_files))
}
