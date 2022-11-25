import useSWR from "swr";

export default function useChannels() {

	const fetcherChannels = async (url: string, token: string) => {
		if (token)
		{
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
	}

	const { data, error, isValidating, mutate }  = useSWR([`${process.env.REACT_APP_URL}/api/channel`, window.localStorage.getItem('jwt_token')], fetcherChannels,{revalidateOnMount: true});

	return {channels: data, error, isValidating, mutate};
}
