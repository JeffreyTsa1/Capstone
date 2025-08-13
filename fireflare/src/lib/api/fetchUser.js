export async function fetchUser(userEmail) {
  // const res = await fetch("http://localhost:3000/user", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({ userId }),
  //   cache: "no-store",
  // });

  // if (!res.ok) throw new Error("Failed to fetch user");
  // return res.json();
  const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/getUserByEmail`);
  url.searchParams.append("email", userEmail);
  const res = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });

  if (res.status === 404) {
    return [];
  }

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return { found: true, data };
}
export default fetchUser;
