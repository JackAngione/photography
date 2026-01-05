"use client";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PhoneInput from "react-phone-number-input/input";
import { z } from "zod";
import Select from "react-select";
import { API_URL } from "@/_utilities/API_UTILS";

export default function BookingPage() {
  const BookingSchema = z
    .object({
      first_name: z.string().min(1, "First name is required"),
      last_name: z.string().min(1, "Last name is required"),

      phone: z
        .string()
        .min(7, "Phone number must be at least 10 digits")
        .optional()
        .or(z.literal("")),

      email: z.email("Invalid email address").optional().or(z.literal("")),

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
    })
    .refine((data) => data.phone || data.email, {
      message: "You must provide either a phone number or an email",
      path: ["email"], // where the error shows; you can change this
    });
  type FormData = z.infer<typeof BookingSchema>;
  const {
    handleSubmit,
    register,
    formState: { errors },
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
      const response = await fetch(API_URL + "/new_booking_request", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(zodResult.data),
      }).then((res) => {
        alert("Booking Request Successfully Submitted!");
        window.location.reload();
      });
    }
  };
  const category_options = [
    { value: "portraiture", label: "Portraiture" },
    { value: "real_estate", label: "Real Estate (indoor/outdoor)" },
    { value: "automotive", label: "Automotive" },
    { value: "event", label: "Event" },
    { value: "product", label: "Product" },
    { value: "other", label: "Other" },
  ];
  return (
    <>
      <div className="flex items-start flex-col  ">
        <h1 className="pl-[3vw] md:pl-[10vw]">BOOKING</h1>
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
            className="border-2 outline-none focus:border-accent"
            {...register("email")}
          />
          <span className="h-4"></span>
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
          <button className="border-2" type="submit">
            Submit
          </button>
        </form>
      </div>
    </>
  );
}
