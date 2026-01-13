"use client";
import AuthGuard from "@/components/AuthGuard";
import { API_URL } from "@/_utilities/API_UTILS";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { z } from "zod";
import "./edit_invoice.css";
import React, { useMemo } from "react";
import countryList from "react-select-country-list";
import states_list from "@/_utilities/us_states.json";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";

export type InvoiceItem = {
  invoice_id: string;
  invoice_item_id: string;
  description: string;
  quantity: number;
  unit_price: number;
};
export type Client = {
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  address_country: string | null;
  client_id: string;
  created_at: string;
};
export type Invoice = {
  client_id: string;
  created_at: string;
  amount_subtotal: number;
  payment_method: number;
  notes: string;
  amount_tax: number;
  amount_total: number;
  booking_id: string;
  invoice_id: string;
  due_date: string;
  payment_completed: boolean;
  paid_at: string;
  invoice_number: number;
  invoiceItems: InvoiceItem[];
};

type PageProps = {
  params: Promise<{
    invoice_id: string;
  }>;
};

export default function EditInvoice() {
  const params = useParams<{ invoice_id: string }>();
  const invoice_id = params.invoice_id;

  //get invoice data in the structure Invoice{invoice: Invoice, invoice_items: InvoiceItem[]}
  const {
    data: invoice,
    isLoading,
    isError,
    isSuccess,
  } = useQuery({
    queryKey: ["invoice"],
    queryFn: async () => {
      const response = await fetch(API_URL + `/invoicing/view/${invoice_id}`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Network response was not ok");
      else {
        return await response.json();
      }
    },
  });

  const InvoiceItemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().int().min(1, "Min quantity is 1."),
    unit_price: z.number().min(0, "Must be >= 0"),
  });

  const InvoiceFormSchema = z
    .object({
      //user can't edit client_id, but it needs to be here for updating the address server side
      client_id: z.string(),

      invoice_items: z
        .array(InvoiceItemSchema)
        .min(1, "Must have at least 1 item"),
      notes: z.string().optional(),
      due_date: z.string().min(1, "Must select a due date"),
      address_street: z
        .string()
        .min(4, "Street must be >= 4 characters")
        .or(z.literal(""))
        .optional(),
      address_city: z
        .string()
        .min(2, "City must be >= 2 characters")
        .or(z.literal(""))
        .optional(),
      address_state: z
        .object({ value: z.string(), label: z.string() })
        .optional(),

      address_zip: z
        .string()
        .min(4, "Zip must be >= 4 characters")
        .or(z.literal(""))
        .optional(),
      address_country: z
        .object({ value: z.string(), label: z.string() })
        .optional(),
      paid_at: z.string().optional(),
      payment_completed: z.boolean(),
    })
    .refine(
      (data) => {
        const values = [
          data.address_street,
          data.address_city,
          data.address_zip,
        ];
        const filledFields = values.filter(
          (field) => field !== undefined && field !== "",
        );

        // Logic: Either none are filled, or all 4 are filled
        return filledFields.length === 0 || filledFields.length === 3;
      },
      {
        message: "You must provide all address fields or none at all",
        path: ["address_street"], // This points the error to the street field
      },
    )
    .refine(
      (data) => {
        if (data.payment_completed) {
          return data.paid_at !== undefined && data.paid_at !== "";
        }
        return true;
      },
      {
        message: "Payment date cannot be blank if payment is completed!",
        path: ["paid_at"], // This points the error to the street field
      },
    );

  const country_list = useMemo(() => countryList().getData(), []);
  const isoToDatetimeLocal = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  type FormData = z.infer<typeof InvoiceFormSchema>;
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(InvoiceFormSchema),
    values: {
      client_id: invoice?.invoice?.client_id,
      invoice_items: invoice?.invoice_items,
      notes: invoice?.invoice?.notes ?? undefined,
      due_date: isoToDatetimeLocal(invoice?.invoice?.due_date) ?? undefined,
      address_street: invoice?.client?.address_street ?? undefined,
      address_city: invoice?.client?.address_city ?? undefined,
      address_state:
        states_list.find((o) => o.value === invoice?.client?.address_state) ??
        undefined,

      address_zip: invoice?.client?.address_zip ?? undefined,
      address_country:
        country_list.find(
          (o) => o.value === invoice?.client?.address_country,
        ) ?? undefined,
      paid_at: isoToDatetimeLocal(invoice?.invoice?.paid_at) ?? undefined,
      payment_completed: invoice?.invoice?.payment_completed,
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "invoice_items",
  });

  //RUN ON FORM SUBMIT
  const onSubmit = async (values: any) => {
    const local_due_date = values.due_date;
    const local_paid_at = values.paid_at;
    // JS interprets this string using the browser's current timezone.
    const due_dateWithCurrentOffset = new Date(local_due_date).toISOString();
    let paid_atWithCurrentOffset = "";
    if (local_paid_at != "") {
      paid_atWithCurrentOffset = new Date(local_paid_at).toISOString();
    }
    //console.log(dateWithCurrentOffset.toISOString());
    // 3. Convert to a full ISO string
    // .toISOString() converts the time to UTC (Z) automatically.
    const finalized_data = {
      ...values,
      due_date: due_dateWithCurrentOffset,
      paid_at: paid_atWithCurrentOffset,
    };

    //Remove empty strings from the json
    const stripped_data = Object.fromEntries(
      Object.entries(finalized_data).filter(
        ([_, v]) => v !== "" && v !== undefined,
      ),
    );

    const zodResult = InvoiceFormSchema.safeParse(stripped_data);
    if (!zodResult.success) {
      //setDisplayError(z.prettifyError(zodResult.error));
    } else {
      console.log("Successful form submit", zodResult.data);
      const response = await fetch(API_URL + "/invoicing/edit/" + invoice_id, {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        credentials: "include",
        body: JSON.stringify(zodResult.data),
      })
        .then(async (res) => {
          if (res.ok) {
            let json = await res.json();
            alert(json.message);
          } else {
            throw new Error();
          }
        })
        .catch((err) => alert("ERROR: " + err.message));
    }
  };
  if (isLoading)
    return (
      <div className="flex justify-center mt-30 items-center">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4">Loading...</div>
        </div>
      </div>
    );
  if (isError)
    return (
      <div className="flex justify-center mt-30 items-center">
        <div className="animate-pulse flex space-x-4">
          Could not find invoice
        </div>
      </div>
    );
  return (
    <AuthGuard>
      <div className="flex items-start pl-[3vw] md:pl-[10vw] flex-col">
        <h1 className="">EDITING INVOICE</h1>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex justify-center border-2  items-center mx-10 mt-30 mb-80 p-6  flex-col "
      >
        <p>Invoice_ID: {invoice_id}</p>
        <span className="h-2"></span>
        <p>Client_ID: {invoice?.invoice.client_id}</p>
        <span className="h-2"></span>
        <p>Booking_ID: {invoice?.invoice.booking_id}</p>
        <span className="h-10"></span>
        {/*DATE*/}
        {errors.due_date && (
          <p className="text-accent">*{errors.due_date.message}</p>
        )}
        <label htmlFor="invoice-due_date">Due Date</label>
        <input
          type="datetime-local"
          className="border-2 "
          {...register("due_date")}
        />

        {/*INVOICE ITEMS*/}
        <div className="flex flex-col  items-center my-10">
          <h2 className="mb-6">Invoice Items</h2>

          <table className="table-auto border-separate border-spacing-4 border-2 ">
            <thead>
              <tr>
                <th> Item </th>
                <th>Quantity</th>
                <th>Unit Price</th>
              </tr>
            </thead>
            <tbody className="">
              {fields.map((field, idx) => (
                <tr key={field.id} className="">
                  <td>
                    <textarea
                      className="border-2 outline-none focus:border-accent"
                      placeholder="Item Description"
                      {...register(`invoice_items.${idx}.description`)}
                    />
                    {errors.invoice_items?.[idx]?.description && (
                      <p style={{ color: "red" }}>
                        {errors.invoice_items[idx]!.description!.message}
                      </p>
                    )}
                  </td>

                  <td>
                    <input
                      className="border-2 pl-2 w-20 focus:border-accent"
                      type="number"
                      placeholder="Qty"
                      {...register(`invoice_items.${idx}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />
                    {errors.invoice_items?.[idx]?.quantity && (
                      <p style={{ color: "red" }}>
                        {errors.invoice_items[idx]!.quantity!.message}
                      </p>
                    )}
                  </td>

                  <td>
                    <div className="flex  items-center border-2 focus:border-accent">
                      <span className="pointer-events-none pl-2">$</span>
                      <input
                        className="w-30 outline-none"
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        {...register(`invoice_items.${idx}.unit_price`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>

                    {errors.invoice_items?.[idx]?.unit_price && (
                      <p style={{ color: "red" }}>
                        {errors.invoice_items[idx]!.unit_price!.message}
                      </p>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="border-2"
                      onClick={() => remove(idx)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            className="border-2 mt-2 flex gap-2 items-center justify-center"
            type="button"
            onClick={() =>
              append({ description: "", quantity: 1, unit_price: 0 })
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            Add item
          </button>
        </div>

        <span className="h-10"></span>

        {/*ADDRESS*/}
        <div className="relative inline-block group">
          <p>Customer Address</p>

          <div
            className="
                  absolute left-1/2  -mt-16 -translate-x-1/2
                  whitespace-nowrap rounded-md bg-black px-3 py-1 text-sm text-white
                  opacity-0 scale-95 transition
                  group-hover:opacity-100 group-hover:scale-100
                  pointer-events-none border-2"
          >
            Enter customer's address, or leave blank to use existing client
            address in database
          </div>
        </div>

        <div className="flex md:flex-row flex-col justify-center border-2 p-2 gap-2 items-center md:items-start">
          <div className="flex flex-col justify-center items-center gap-2">
            <label htmlFor="invoice-address">Street</label>
            <input
              className="border-2 h-9.5 outline-none focus:border-accent"
              {...register("address_street")}
            />
          </div>
          <div className="flex flex-col justify-center items-center gap-2">
            <label htmlFor="invoice-address">City</label>
            <input
              className="border-2 w-40 h-9.5 outline-none focus:border-accent"
              {...register("address_city")}
            />
          </div>
          <div className="flex flex-col justify-center items-center gap-2">
            <label htmlFor="invoice-state">State</label>

            <Controller
              name="address_state"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={states_list}
                  placeholder="N/A"
                  isClearable
                  // This ensures the styling stays consistent even on error
                  instanceId="state-select"
                  classNames={{
                    input: () => "mx-1.5",
                    placeholder: () => "mx-1.5",
                    control: (state) =>
                      state.isFocused
                        ? "border-2 px-1.5 border-accent"
                        : "border-2  px-1.5 border-foreground",
                    menu: () => "bg-background border-2 border-foreground",
                    option: (state) =>
                      state.isSelected
                        ? "text-accent px-1.5 border-accent"
                        : state.isFocused
                          ? "text-accent px-1.5 border-accent"
                          : " border-accent px-1.5 ",
                  }}
                  unstyled
                />
              )}
            />
          </div>
          <div className="flex flex-col justify-center items-center gap-2">
            <label htmlFor="invoice-address">Zip Code</label>
            <input
              className="border-2 w-20 h-9.5 outline-none focus:border-accent"
              inputMode="numeric"
              type="text"
              {...register("address_zip")}
            />
          </div>
          <div className="flex flex-col justify-center items-center gap-2">
            <label htmlFor="invoice-state">Country</label>

            <Controller
              name="address_country"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={country_list}
                  placeholder="N/A"
                  isClearable
                  // This ensures the styling stays consistent even on error
                  instanceId="country-select"
                  classNames={{
                    input: () => "mx-1.5",
                    placeholder: () => " mx-1.5",
                    control: (state) =>
                      state.isFocused
                        ? "border-2 px-1.5 border-accent"
                        : "border-2 px-1.5 border-foreground",
                    menu: () => "bg-background border-2 border-foreground",
                    option: (state) =>
                      state.isSelected
                        ? "text-accent px-1.5 border-accent"
                        : state.isFocused
                          ? "text-accent px-1.5 border-accent"
                          : " border-accent px-1.5 ",
                    multiValue: () => "bg-background  mx-1.5 my-0.5",
                    multiValueLabel: () => "text-foreground",
                    multiValueRemove: () => "hover:text-accent",
                  }}
                  unstyled
                />
              )}
            />
          </div>
        </div>
        <div className="text-accent flex flex-col justify-center items-center">
          {errors.address_street && (
            <p>Street: {errors.address_street.message}</p>
          )}
          {errors.address_city && <p>City:{errors.address_city.message}</p>}
          {errors.address_state && <p>State: {errors.address_state.message}</p>}
          {errors.address_zip && <p>Zip:{errors.address_zip.message}</p>}
          {errors.address_country && (
            <p>Country:{errors.address_country.message}</p>
          )}
        </div>
        <span className="h-10"></span>
        {errors.notes && (
          <p className="text-accent">Notes: {errors.notes.message}</p>
        )}
        <label htmlFor="invoice-notes">Notes</label>
        <textarea
          className="border-2 w-100 outline-none focus:border-accent"
          {...register("notes")}
        />
        <span className="h-10" />
        <p>
          Payment Complete:{" "}
          <input type="checkbox" {...register("payment_completed")} />
        </p>
        <span className="h-4" />
        {/*PAYMENT DATE*/}
        {errors.paid_at && (
          <p className="text-accent">*{errors.paid_at.message}</p>
        )}
        <label htmlFor="invoice-due_date">Payment Date</label>
        <input
          type="datetime-local"
          className="border-2 "
          {...register("paid_at")}
        />

        <span className="h-10"></span>
        <button className="border-2" type="submit">
          Create Invoice
        </button>
      </form>
    </AuthGuard>
  );
}
