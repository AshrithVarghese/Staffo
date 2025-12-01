import React from "react";

export default function Notfound() {
  return (
    <section className="relative z-10 bg-black py-24 min-h-screen flex items-center">
      <div className="container mx-auto px-4">
        <div className="flex justify-center">
          <div className="text-center max-w-xs sm:max-w-sm md:max-w-md">
            <h2 className="mb-2 text-white font-bold leading-none
              text-[90px]      /* mobile */
              sm:text-[110px]   /* small screens */
              md:text-[150px]   /* tablets */
              lg:text-[150px]   /* desktop */
            ">
              404
            </h2>

            <h4 className="mb-3 text-white font-semibold leading-tight
              text-[16px]
              sm:text-[18px]
              md:text-[22px]
            ">
              This page isn’t available
            </h4>

            <p className="mb-8 text-white
              text-sm
              sm:text-base
            ">
              It may have been moved or no longer exists.
            </p>

            <a
              href="/"
              className="inline-block rounded-lg border border-white text-white transition
                hover:bg-white hover:text-black
                px-5 py-2 text-sm    /* mobile */
                sm:px-6 sm:py-2.5 sm:text-base
                md:px-8 md:py-3     /* desktop */
              "
            >
              Go To Home
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
