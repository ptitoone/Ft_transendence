import useSWR from "swr";

export default function useUsers() {

	const fetcherFriends = async (url: string, token: string) => {
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
	const { data, error, isValidating, mutate }  = useSWR([`${process.env.REACT_APP_URL}/api/users`, window.localStorage.getItem('jwt_token')], fetcherFriends,{revalidateOnMount: true});

	return {users: data, error, isValidating, mutate};
}
