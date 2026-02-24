"use client";
import AuthGuard from "@/components/AuthGuard";
import { API_URL } from "@/_utilities/API_UTILS";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { z } from "zod";
import React, { useMemo } from "react";
import countryList from "react-select-country-list";
import states_list from "@/_utilities/us_states.json";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";
import PhoneInput from "react-phone-number-input/input";
import Link from "next/link";

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
// Get all unique IANA timezone names
const timezones = Intl.supportedValuesOf("timeZone").map((tz) => ({
  value: tz,
  label: tz.replace(/_/g, " "),
}));

export default function CreateClient() {
  const router = useRouter();

  const CreateClientFormSchema = z
    .object({
      first_name: z.string().min(2, "First name must be >= 2 characters"),
      last_name: z.string().min(2, "Last name must be >= 2 characters"),
      phone: z
        .string("Invalid Phone number")
        .min(12, "Invalid Phone number")
        .optional(),

      email: z.email().optional().or(z.literal("")),
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
        .optional()
        .nullable(),
      address_zip: z
        .string()
        .min(4, "Zip must be >= 4 characters")
        .or(z.literal(""))
        .optional(),
      address_country: z
        .object({ value: z.string(), label: z.string() })
        .optional(),
      timezone: z.string().optional(),
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
        // 1. Check if email is present AND not an empty string
        const hasEmail = !!data.email;

        // 2. Check if phone is present AND not an empty string
        const hasPhone = !!data.phone;

        // 3. Return TRUE only if at least one exists
        return hasEmail || hasPhone;
      },
      {
        message: "You must provide either a phone number or an email",
        path: ["email"], // This decides where the red error text appears (e.g., under Email)
      },
    );

  const country_list = useMemo(() => countryList().getData(), []);
  country_list.forEach((o) => (o.value = o.label));
  const isoToDatetimeLocal = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  type FormData = z.infer<typeof CreateClientFormSchema>;
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(CreateClientFormSchema),
  });
  console.log(errors);
  //RUN ON FORM SUBMIT
  const onSubmit = async (values: any) => {
    console.log("submitting:", values);
    //parse data first
    const zodResult = CreateClientFormSchema.safeParse(values);
    if (!zodResult.success) {
      console.log("Form submission failed:", zodResult.error);
      //setDisplayError(z.prettifyError(zodResult.error));
    } else {
      //convert country and stateobject to string
      const transformed = {
        ...zodResult.data,
        address_country: values.address_country?.value,
        address_state: values.address_state?.value,
      };
      //Remove empty strings from the json
      const stripped_data = Object.fromEntries(
        Object.entries(transformed).filter(
          ([_, v]) => v !== "" && v !== undefined,
        ),
      );
      console.log("finalsend:", stripped_data);
      const response = await fetch(API_URL + "/clientele/create", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        credentials: "include",
        body: JSON.stringify(stripped_data),
      })
        .then(async (res) => {
          if (res.ok) {
            let json = await res.json();
            alert(json.message);
            router.push("/admin/clientele");
          } else {
            throw new Error();
          }
        })
        .catch((err) => alert("ERROR: " + err.message));
    }
  };

  return (
    <AuthGuard>
      <div className="flex pl-[3vw] sm:pl-[6vw] flex-col">
        <h1 className="">CREATE</h1>
        <h1> CLIENT</h1>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex justify-center border-2  items-center mx-10 mt-30 mb-80 p-6  flex-col "
      >
        {errors.first_name && <p>{errors.first_name.message}</p>}
        <label className="flex flex-col justify-center items-center">
          First Name
          <input
            autoComplete="first name"
            className="border-2  outline-none focus:border-accent"
            {...register("first_name")}
          />
        </label>
        {errors.last_name && <p>{errors.last_name.message}</p>}
        <label className="flex flex-col justify-center items-center">
          Last Name
          <input
            autoComplete="last name"
            className="border-2  outline-none focus:border-accent"
            {...register("last_name")}
          />
        </label>

        <span className="h-6"></span>
        {errors.email && <p>{errors.email.message}</p>}
        <label className="flex flex-col justify-center items-center">
          Email
          <input
            autoComplete="email"
            className="border-2  outline-none focus:border-accent"
            {...register("email")}
          />
        </label>

        {errors.phone && <p className="text-accent">*{errors.phone.message}</p>}
        <label className="flex flex-col justify-center items-center">
          Phone
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                {...field}
                value={field.value}
                country="US"
                className="border-2 outline-none focus:border-accent"
              />
            )}
          />
        </label>

        <span className="h-10"></span>
        {/*ADDRESS*/}

        <p>ADDRESS</p>

        <div className="flex md:flex-row flex-col justify-center border-2 p-2 gap-2 items-center md:items-start">
          <div className="flex flex-col justify-center items-center gap-2">
            <label className="flex flex-col justify-center items-center">
              Street
              <input
                className="border-2  outline-none focus:border-accent"
                {...register("address_street")}
              />
            </label>
          </div>
          <label className="flex flex-col justify-center items-center">
            City
            <input
              className="border-2 w-40  outline-none focus:border-accent"
              {...register("address_city")}
            />
          </label>
          <label className="flex flex-col justify-center items-center">
            State
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
                    input: () => "mx-1.5 min-w-20",
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
          </label>

          <label className="flex flex-col justify-center items-center">
            Zip Code
            <input
              className="border-2 w-20 h-9.5 outline-none focus:border-accent"
              inputMode="numeric"
              type="text"
              {...register("address_zip")}
            />
          </label>

          <label className="flex flex-col justify-center items-center">
            Country
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
                    input: () => "mx-1.5 min-w-20",
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
          </label>
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

        <span className="h-6"></span>

        <label className="flex flex-col justify-center items-center">
          Timezone
          <Controller
            name="timezone"
            control={control}
            render={({ field: { onChange, value, ref, ...field } }) => (
              <Select
                instanceId="timezone-select"
                {...field}
                options={timezones}
                // 2. Transform the VALUE for React Select (String -> Object)
                // We need to find the full object based on the string value stored in the form
                value={timezones.find((c) => c.value === value) || null}
                // 3. Transform the ONCHANGE for the Form (Object -> String)
                // We pull the .value out of the selected option
                onChange={(selectedOption) => {
                  onChange(selectedOption ? selectedOption.value : "");
                }}
                isSearchable={true}
                classNames={{
                  input: () => "mx-1.5",
                  placeholder: () => " mx-1.5",
                  control: (state) =>
                    state.isFocused
                      ? "border-2 border-accent"
                      : "border-2 border-foreground",
                  menu: () => "bg-background border-2 border-foreground",
                  option: (state) =>
                    state.isSelected
                      ? "text-accent px-1.5 border-accent"
                      : state.isFocused
                        ? "text-accent px-1.5 border-accent"
                        : "border-accent px-1.5",
                  multiValue: () =>
                    "bg-background border-1 px-1.5 mx-1.5 my-0.5",
                  multiValueLabel: () => "text-foreground",
                  multiValueRemove: () => "hover:text-accent",
                }}
                unstyled
                placeholder="Search timezone..."
              />
            )}
          />
        </label>
        <span className="h-8"></span>
        <div className="flex justify-center items-center gap-4">
          <Link href={`/admin/clientele`}>Cancel</Link>
          <button
            className="border-2"
            type="submit"
            onClick={() => console.log("button clicked")}
          >
            Create Client
          </button>
        </div>
      </form>
    </AuthGuard>
  );
}
