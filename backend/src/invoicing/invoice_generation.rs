use crate::AppState;
use crate::invoicing::invoice;
use crate::invoicing::invoice::ReturnFullInvoice;
use axum::Json;
use axum::extract::{Path, State};
use axum::response::Response;
use chrono::prelude::*;
use chrono::{DateTime, TimeZone, Utc};
use chrono_tz::Tz;
use http::StatusCode;
use typst::foundations::{Array, Datetime, Dict, Value, array, dict};
use typst_as_lib::TypstEngine;
use typst_as_lib::typst_kit_options::TypstKitFontOptions;
//use rust to fill out a .typ template file.
//save file -> run a bash script to convert .typ to pdf using Typst CLI
// send .pdf to customer email
// main.rs
#[cfg(test)]
mod tests {
    use super::*;

    /* #[test]
    fn pdf_test() {
        create_pdf();
    }*/
}

static TEMPLATE_FILE: &str = include_str!("typst/template.typ");
static FONT: &[u8] = include_bytes!("typst/fonts/evangelion-regular.otf");
static FONT2: &[u8] = include_bytes!("typst/fonts/maison-galliard-serif.otf");
static OUTPUT: &str = "output.pdf";
//static IMAGE: &[u8] = include_bytes!("./templates/images/typst.png");

pub(crate) async fn generate_pdf(
    State(state): State<AppState>,
    Path(invoice_id): Path<String>,
) -> Response
/*-> Result<String, StatusCode>*/
{
    let font_paths = vec![std::path::Path::new("./fonts")];
    // Read in fonts and the main source file.
    // We can use this template more than once, if needed (Possibly
    // with different input each time).

    let template = TypstEngine::builder()
        .main_file(TEMPLATE_FILE)
        //.fonts([FONT, FONT2])
        .search_fonts_with(
            TypstKitFontOptions::default()
                .include_system_fonts(false)
                // This line is not necessary, because thats the default.
                .include_embedded_fonts(true),
        )
        .build();

    let invoice = invoice::view_invoice(State(state), Path(invoice_id))
        .await
        .map_err(|_| StatusCode::NOT_FOUND)
        .unwrap();

    let Json(ReturnFullInvoice {
        invoice,
        client,
        invoice_items,
    }) = invoice;
    let iana_name = client.timezone.unwrap_or("America/New_York".to_string());
    let timezone: Tz = iana_name.parse().unwrap();
    let mut typst_due_date: Option<Datetime> = None;
    if invoice.due_date.is_some() {
        let due_date = invoice.due_date.unwrap();
        let secs = due_date.unix_timestamp();
        let nanos = due_date.nanosecond();

        let dt: DateTime<Utc> = Utc
            .timestamp_opt(secs, nanos)
            .single()
            .expect("invalid timestamp");
        //timezone adjusted
        let tz_adjusted_dt = dt.with_timezone(&timezone);

        // Create Typst Datetime
        typst_due_date = Datetime::from_ymd(
            tz_adjusted_dt.year(),
            tz_adjusted_dt.month() as u8,
            tz_adjusted_dt.day() as u8,
        )
    }
    //prepare invoice items for Typst
    let mut invoice_items_array = Array::new();
    for item in invoice_items {
        let mut temp_dict = Dict::new();
        temp_dict.insert("description".into(), Value::Str(item.description.into()));
        temp_dict.insert("quantity".into(), Value::Int(item.quantity.into()));
        temp_dict.insert(
            "unit_price".into(),
            Value::Str(item.unit_price.to_string().into()),
        );
        invoice_items_array.push(Value::Dict(temp_dict));
    }

    let input_data = dict! {
        "invoice" => dict! {
            "invoice_number" => invoice.invoice_number,
            "due_date" => typst_due_date,
            "amount_subtotal" => invoice.amount_subtotal.unwrap_or(0.into()).to_string(),
            "amount_tax"=> invoice.amount_tax.unwrap_or(0.into()).to_string(),
            "amount_total"=> invoice.amount_total.unwrap_or(0.into()).to_string(),
            "notes" => invoice.notes
        },
        "invoice_items" => invoice_items_array,
         "client" => dict! {
            "first_name" => client.first_name,
            "last_name" => client.last_name,
            "email" => client.email,
            "phone" => client.phone,
            "address_street" => client.address_street,
            "address_city" => client.address_city,
            "address_state" => client.address_state,
            "address_zip" => client.address_zip,
            "address_country" => client.address_country
        },
    };

    /* let doc = template
    //.compile()
    .compile_with_input(input_data)
    .output
    .expect("typst::compile() returned an error!");*/
    let pdf = typst_bake::document!("template.typ")
        .with_inputs(input_data)
        .to_pdf()
        .unwrap();

    // Create pdf
    //let options = Default::default();
    //let pdf = typst_pdf::pdf(&doc, &options).expect("Could not generate pdf.");

    Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/pdf")
        // let the browser display it inline; use "attachment" to force download
        .header("Content-Disposition", "inline; filename=\"report.pdf\"")
        .body(axum::body::Body::from(pdf))
        .unwrap()
    /*  fs::write(OUTPUT, pdf).expect("Could not write pdf.");
    println!("Wrote pdf to {}", OUTPUT);*/
}
