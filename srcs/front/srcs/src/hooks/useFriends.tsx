import useSWR from "swr";

export default function useFriends(id?: null | string) {
	const fetcherFriends = async (url: string, token: string) => {
		if (token && id)
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

	const { data, error, isValidating, mutate }  = useSWR([`${process.env.REACT_APP_URL}/api/users/friends/${id}`, window.localStorage.getItem('jwt_token')], fetcherFriends,{revalidateOnMount: true});

	return {friends: data, error, isValidating, mutateFriends: mutate};
}
