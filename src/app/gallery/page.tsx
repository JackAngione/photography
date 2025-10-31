"use client";
import CategorySelection from "@/app/gallery/_components/categoryselection";
import { motion } from "motion/react";

export default function Page() {
  return (
    <>
      <div className="flex items-start flex-col  ">
        <div className="flex flex-col justify-center items-center pl-[3vw] md:pl-[10vw]">
          <h1 className="">GALLERY</h1>
          <div className=" self-center text-white text-[3.5rem]">
            <motion.div
              className="text-sm"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
              }}
              transition={{
                opacity: { delay: 1, duration: 1 },
              }}
            >
              click a category to view more
            </motion.div>
          </div>
        </div>
      </div>
      <div className="flex justify-center text-center items-center">
        <CategorySelection />
      </div>
    </>
  );
}
