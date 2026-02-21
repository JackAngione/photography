"use client";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PhoneInput from "react-phone-number-input/input";
import { z } from "zod";
import Select from "react-select";
import { API_URL, TURNSTILE_SITE_KEY } from "@/_utilities/API_UTILS";
import { Turnstile } from "@marsidev/react-turnstile";
import React, { useEffect, useState } from "react";

// Get all unique IANA timezone names
const timezones = Intl.supportedValuesOf("timeZone").map((tz) => ({
  value: tz,
  label: tz.replace(/_/g, " "),
}));
export default function BookingPage() {
  // Detect OS timezone on mount
  const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  useEffect(() => {
    const defaultOption = timezones.find((t) => t.value === detectedTz)?.value;
    if (defaultOption !== undefined) {
      //setSelectedTz(defaultOption);
      setValue("timezone", defaultOption, { shouldValidate: true });
    }
  }, []);
  const BookingSchema = z
    .object({
      first_name: z.string().min(1, "First name is required"),
      last_name: z.string().min(1, "Last name is required"),

      phone: z
        .string("Invalid Phone number")
        .min(12, "Invalid Phone number")
        .optional(),

      email: z.email().optional().or(z.literal("")),

      categories: z
        .array(
          z.object({
            value: z.string(),
            label: z.string(),
          }),
        )
        .min(1, "Please select at least one category"),

      comments: z
        .string("must write something in the comments box")
        .min(5, "Comments must be at least 5 characters")
        .max(3000, "Comments must be less than 3000 characters"),
      timezone: z.string().optional(),
      turnstile_token: z.string("Invalid Token"),
    })
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
  type FormData = z.infer<typeof BookingSchema>;
  const {
    handleSubmit,
    register,
    formState: { errors },
    setValue,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(BookingSchema),
    defaultValues: {
      categories: [],
    },
  });
  //RUN ON FORM SUBMIT
  const onSubmit = async (values: any) => {
    const zodResult = BookingSchema.safeParse(values);

    if (!zodResult.success) {
      //setDisplayError(z.prettifyError(zodResult.error));
    } else {
      console.log("Successful form submit", zodResult.data);
      await fetch(API_URL + "/booking/create", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(zodResult.data),
      })
        .then(async (res) => {
          const body = await res.json();

          alert(body);
          if (res.ok) {
            window.location.reload();
          }
        })
        .catch((err) => alert("ERROR: " + err.body));
    }
  };
  const category_options = [
    { value: "portraiture", label: "Portraiture" },
    { value: "real_estate", label: "Real Estate" },
    { value: "automotive", label: "Automotive" },
    { value: "event", label: "Event" },
    { value: "product", label: "Product" },
    { value: "other", label: "Other" },
  ];

  return (
    <>
      <div className="flex flex-col ">
        <h1 className="pl-[3vw] sm:pl-[6vw]">BOOKING</h1>
      </div>
      <div className="flex flex-col  justify-center items-center ">
        {/*{displayError}*/}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex my-30 border-2 p-8 max-w-[65vw] flex-col "
        >
          {errors.first_name && (
            <p className="text-accent">*{errors.first_name.message}</p>
          )}
          <label htmlFor="booking-title">First Name</label>
          <input
            className="border-2 outline-none focus:border-accent"
            {...register("first_name")}
          />
          <span className="h-4"></span>
          {errors.last_name && (
            <p className="text-accent">*{errors.last_name.message}</p>
          )}
          <label htmlFor="booking-title">Last Name</label>
          <input
            className="border-2 outline-none focus:border-accent"
            {...register("last_name")}
          />
          <span className="h-4"></span>

          {errors.email && (
            <p className="text-accent">*{errors.email.message}</p>
          )}

          <label htmlFor="booking-contact">Email</label>
          <input
            type="email"
            className="border-2 outline-none focus:border-accent"
            {...register("email")}
          />
          <span className="h-4"></span>
          {errors.phone && (
            <p className="text-accent">*{errors.phone.message}</p>
          )}
          <label htmlFor="booking-contact">Phone</label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                {...field}
                country="US"
                className="border-2 outline-none focus:border-accent"
              />
            )}
          />
          <span className="h-4"></span>
          <p>What type(s) of photography work?</p>
          {errors.categories && (
            <p className="text-accent">*{errors.categories.message}</p>
          )}
          <Controller
            name="categories"
            control={control}
            render={({ field }) => (
              <Select
                instanceId="category-select"
                {...field}
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
                options={category_options}
                unstyled
                isMulti
              />
            )}
          />

          <span className="h-4"></span>
          {errors.comments && (
            <p className="text-accent">*{errors.comments.message}</p>
          )}
          <label htmlFor="booking-contact">
            Please include more details of the work you're looking for
          </label>
          <textarea
            className="border-2 outline-none focus:border-accent"
            {...register("comments")}
          ></textarea>
          <span className="h-4"></span>
          {errors.turnstile_token && (
            <p className="text-accent">*{errors.turnstile_token.message}</p>
          )}

          {detectedTz !== "America/New_York" ? (
            <div>
              <label htmlFor="booking-contact">
                Please enter your timezone
              </label>
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
            </div>
          ) : (
            <></>
          )}
          <span className="h-4"></span>
          <div className="justify-center flex">
            <Turnstile
              className="outline-2"
              siteKey={TURNSTILE_SITE_KEY!}
              onSuccess={(token) =>
                setValue("turnstile_token", token, { shouldValidate: true })
              }
              onExpire={() =>
                setValue("turnstile_token", "", { shouldValidate: true })
              }
              options={{
                theme: "dark",
                size: "normal",
              }}
            />
          </div>

          <span className="h-4"></span>
          <button className="border-2" type="submit">
            Submit
          </button>
        </form>
      </div>
    </>
  );
}
