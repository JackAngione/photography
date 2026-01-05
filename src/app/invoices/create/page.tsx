"use client";
import AuthGuard from "@/components/AuthGuard";
import { z } from "zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { API_URL } from "@/_utilities/API_UTILS";
import "./create_invoice.css";
import countryList from "react-select-country-list";
import Select from "react-select";
import states_data from "../../../_utilities/us_states.json";
import { useMemo } from "react";

export default function CreateInvoice() {
  const InvoiceItemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().int().min(1, "Min quantity is 1."),
    unit_price: z.number().min(0, "Must be >= 0"),
  });

  // Helper to convert empty strings to undefined
  const emptyToUndefined = z.literal("").transform(() => undefined);
  const stringOrEmpty = z
    .string()
    .length(6, "must be 6 characters")
    .trim()
    .or(emptyToUndefined);
  const InvoiceFormSchema = z
    .object({
      booking_id: stringOrEmpty.optional(),

      client_id: stringOrEmpty.optional(),

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
    .refine((data) => data.booking_id || data.client_id, {
      message:
        "You must provide either a booking_id or a client_id to retrieve proper client information",
      path: ["client_id"], // where the error shows; you can change this
    });

  const country_list = useMemo(() => countryList().getData(), []);
  const defaultCountry = country_list.find((opt) => opt.value === "US");
  const defaultState = states_data.find((opt) => opt.value === "MD");

  type FormData = z.infer<typeof InvoiceFormSchema>;
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(InvoiceFormSchema),
    defaultValues: {
      booking_id: "",
      client_id: "",
      invoice_items: [{ description: "", quantity: 0, unit_price: 0.0 }],
      notes: "",
      address_country: defaultCountry || undefined,
      address_state: defaultState || undefined,
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "invoice_items",
  });
  //RUN ON FORM SUBMIT
  const onSubmit = async (values: any) => {
    const localDateTime = values.due_date;

    // JS interprets this string using the browser's current timezone.
    const dateWithCurrentOffset = new Date(localDateTime);
    console.log(dateWithCurrentOffset.toISOString());
    // 3. Convert to a full ISO string
    // .toISOString() converts the time to UTC (Z) automatically.
    const finalized_data = {
      ...values,
      due_date: dateWithCurrentOffset.toISOString(),
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

      const response = await fetch(API_URL + "/create_invoice", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        credentials: "include",
        body: JSON.stringify(zodResult.data),
      })
        .then((res) => res.json())
        .then((json) => alert(json.message))
        .catch((err) => alert("ERROR: " + err.message));
    }
  };

  return (
    <AuthGuard>
      <div className="flex items-start pl-[3vw] md:pl-[10vw] flex-col">
        <h1 className="">NEW INVOICE </h1>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex justify-center border-2  items-center mx-10 mt-30 mb-80 p-10  flex-col "
      >
        {errors.client_id && (
          <p className="text-accent">*{errors.client_id.message}</p>
        )}

        <div className="relative inline-block group">
          <label htmlFor="invoice-client_id">client_id</label>

          <div
            className="
                  absolute left-1/2  -mt-16 -translate-x-1/2
                  whitespace-nowrap rounded-md bg-background px-3 py-1 text-sm text-white
                  opacity-0 scale-95 transition
                  group-hover:opacity-100 group-hover:scale-100
                  pointer-events-none border-2"
          >
            Uses existing client information from the database
          </div>
        </div>
        <input
          className="border-2 outline-none focus:border-accent"
          {...register("client_id")}
        />
        {errors.booking_id && (
          <p className="text-accent">*{errors.booking_id.message}</p>
        )}

        <div className="relative inline-block group">
          <label htmlFor="invoice-booking_id">booking_id</label>

          <div
            className="
    absolute left-1/2  -mt-16 -translate-x-1/2
    whitespace-nowrap rounded-md bg-background px-3 py-1 text-sm text-white
    opacity-0 scale-95 transition
    group-hover:opacity-100 group-hover:scale-100
    pointer-events-none border-2
  "
          >
            <p>Gets client information submitted in the booking request </p>
            <p>and creates a new client entry in the database</p>
          </div>
        </div>
        <input
          className="border-2 outline-none focus:border-accent"
          {...register("booking_id")}
        />
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

          {/*TODO use an icon for the add button*/}
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
                  options={states_data}
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
          {errors.address_street && <p>{errors.address_street.message}</p>}
          {errors.address_city && <p>{errors.address_city.message}</p>}
          {errors.address_state && <p>{errors.address_state.message}</p>}
          {errors.address_zip && <p>{errors.address_zip.message}</p>}
          {errors.address_country && <p>{errors.address_country.message}</p>}
        </div>
        <span className="h-4"></span>
        {errors.notes && <p className="text-accent">*{errors.notes.message}</p>}
        <label htmlFor="invoice-notes">Notes</label>
        <textarea
          className="border-2 w-100 outline-none focus:border-accent"
          {...register("notes")}
        />
        <span className="h-10"></span>
        <button className="border-2" type="submit">
          Create Invoice
        </button>
      </form>
    </AuthGuard>
  );
}
