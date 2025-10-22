"use client";
import {motion} from "motion/react";
import {useRouter} from "next/router";
import Link from "next/link";

export default function AnimatedButton({text}: {text:string}) {

    return (
        <div className=" flex flex-col items-center justify-center gap-4 p-10">

            <motion.div
                className="relative mt-16 overflow-hidden rounded-lg p-0.75"
                initial={{
                    boxShadow: "0px 0px 30px 1px rgba(255, 255, 255, 0.5)",
                }}
                whileHover={{
                    boxShadow: "0px 0px 30px 2px rgba(255, 255, 255, 1)",
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >

                <motion.div
                    className="absolute inset-0 scale-400 rounded-4xl bg-conic/decreasing from-violet-500 via-lime-500 to-violet-500"
                    animate={{
                        rotate: 360,
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
                <Link href="/gallery">
                    <button
                        className="relative focus:outline-none"
                        onClick={() => {

                        }}
                    >
                        {text}
                    </button>
                </Link>

            </motion.div>

        </div>


   )
}
