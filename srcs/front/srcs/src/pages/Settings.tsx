import { FormControl, FormLabel, Input, SimpleGrid, Switch, Button, Flex, Alert, AlertIcon, AlertDescription, Image } from "@chakra-ui/react";
import { useState, useRef, FormEvent } from 'react'
import useProfil from "../hooks/useProfil";
import useSWR from 'swr'


const QrCode = () => {

	const getQrcode = async (url:string, token:string) => {
		let res:Response = await fetch(url, {
			headers: {
				'Content-Type': 'image/png',
				'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
			},
		})
		if (!res.ok)
			throw Error("Server error");
		const blob = await res.blob();
		return URL.createObjectURL(blob);
	}

	const {data, error} = useSWR([`${process.env.REACT_APP_URL}/api/auth/twofactor`, window.localStorage.getItem('jwt_token')], getQrcode,  {
		revalidateIfStale: false,
		revalidateOnFocus: false,
		revalidateOnReconnect: true,
	});

	if (error) {
		return (
			<Flex boxSize='sm'>
				<Alert m='auto' p='auto' status='error' variant='solid' borderRadius={7}>
					<AlertIcon />
					Servor Error, can't get Qrcode
				</Alert>
			</Flex>
		);
	}
	else {
		return (
			<Flex m='auto' p='auto' flexDirection='column'>
				<Image m='auto' p='auto' src={data} alt='Qrcode' borderRadius={7} />
				<Alert m='auto' mt={5} p='auto' status='warning' variant='solid' borderRadius={7}>
					<AlertIcon />
					Please be sure that you scan this qrcode in your google authenticator app
				</Alert>
			</Flex>
		);
	}
}

const Settings = () => {

	const [alert, setAlert] = useState<null | any>(null);
	const ref = useRef<HTMLInputElement>(null);
	const {profil, mutate} = useProfil();

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (ref.current?.value)
		{
			let res:Response = await fetch(`${process.env.REACT_APP_URL}/api/users/username`, {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
			},
			body: JSON.stringify({username: ref.current.value}),
			});
			if (res.ok) {
				const updateUserData = await res.json();
				if (updateUserData.error)
					setAlert({status: 'error', message: updateUserData.error});
				else {
					setAlert({status: 'success', message: updateUserData.message})
					mutate({...profil, username: ref.current.value }, {revalidate: false});
				}
			}
			else {
				setAlert({status: 'error', message: 'Servor error'});
				mutate();
			}
			ref.current.value = '';
		}
	}

	const handle2fa = async () => {

		let newStatus : boolean;
		if (profil.status2FA)
			newStatus = false;
		else
			newStatus = true;
		let res:Response = await fetch(`${process.env.REACT_APP_URL}/api/auth/twofactor`, {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
			},
			body: JSON.stringify({status: newStatus}),
		});
		let responseData = await res.json();
		if (!res.ok && res.status === 401) {
			mutate();
		}
		else if (responseData?.message === 'Success')
			mutate({...profil, status2FA: newStatus}, {revalidate: false});
	}

	return (
	<Flex flexDirection='column' gap='10'>
		{alert ?
			<Alert status={alert.status} variant='solid' borderRadius={7}>
			<AlertIcon />
			<AlertDescription>{alert.message}</AlertDescription>
			</Alert>
		: null}
		<form  onSubmit={handleSubmit}>
		<FormControl  as={SimpleGrid} columns='2'>
				<Input  ref={ref} type="text" isRequired={true} placeholder={profil?.username} _placeholder={{color: 'white'}} />
				<Button type='submit' bg='#4CAE32'>change</Button>
				<FormLabel fontWeight='bold' my={4} mx={'auto'} htmlFor='2fa'>Enable 2fa:</FormLabel>
				{ profil ?
					<Switch my={4} mx={'auto'} id='2fa' colorScheme='green' defaultChecked={profil?.status2FA} onChange={handle2fa}/> : null
				}
		</FormControl>
		</form>
		{profil?.status2FA === true ?
			<QrCode/>
		: null}
	</Flex>
	);
}

export default Settings;
