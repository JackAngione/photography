import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex flex-col items-end ">
      <Link className="hover:text-amber-600 " href="/">
        HOME
      </Link>
      <Link className="hover:text-amber-600 " href="/about">
        ABOUT
      </Link>
      {/*TODO: make this a little dropdown with socails/email*/}
      <Link className="hover:text-amber-600 " href="/gallery">
        GALLERY
      </Link>
      <Link className="hover:text-amber-600 " href="/contact">
        CONTACT
      </Link>
    </nav>
  );
}
