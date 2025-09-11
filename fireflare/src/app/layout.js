import "./globals.css";

export const metadata = {
  title: "Fireflare",
  description: "Fireflare is a community science application designed to help users report and manage wildfire incidents efficiently.",
};

export default function RootLayout({ children, map }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/gaf4wjv.css"></link>


      </head>
            <body>
        <div>
          {map}
        </div>
        <div style={{}}>
          {children}
        </div>
      </body>
    </html>
  );
}
