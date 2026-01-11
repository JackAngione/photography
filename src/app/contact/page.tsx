export default function ContactPage() {
  return (
    <>
      <div className="flex items-start flex-col  ">
        <div className="flex flex-col  items-center pl-[3vw] md:pl-[10vw]">
          <h1 className="">CONTACT</h1>
          <div className="flex flex-col justify-start items-start gap-2 ">
            <a href="https://www.instagram.com/jackangione/" target="_blank">
              <div className="flex items-center  ">
                <img
                  src="/icons/Instagram_Glyph_White.svg"
                  className="size-6 mr-2"
                  alt={"instagram logo"}
                />
                <h2>Jack Angione</h2>
              </div>
            </a>

            <div className="flex justify-center items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6 mr-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>

              <h2>angionejack@gmail.com</h2>
            </div>
            <p>Perry Hall, MD</p>
          </div>
        </div>
      </div>
    </>
  );
}
