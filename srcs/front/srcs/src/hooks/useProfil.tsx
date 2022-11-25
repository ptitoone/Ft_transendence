import useSWR from "swr";

type swrArgs = {
	opts: any;
	url: string;
}

export default function useProfil(id?: null | string) {

	const fetcherProfil = async (url: string, token: string) => {
		if (!token)
			throw Error("error");
		const res = await fetch(url, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			}
		})
		const data = await res.json();
		if (!res.ok)
			throw Error(`${data.statusCode}: ${data.message}`);
		return data;
	}

	let args: swrArgs = {url: 'me', opts: {
		revalidateIfStale: false,
		revalidateOnFocus: false,
		revalidateOnReconnect: true,
	}}
	if (id) {
		args.url = id;
		args.opts = {revalidateOnMount: true}
	}

	const { data, error, isValidating, mutate }  = useSWR([`${process.env.REACT_APP_URL}/api/users/${args.url}`, window.localStorage.getItem('jwt_token')], fetcherProfil, args.opts);

	return {profil: data, error, isValidating, mutate};
}
