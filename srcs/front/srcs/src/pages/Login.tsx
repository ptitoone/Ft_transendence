import { Flex, Box, Stack, Button, Heading, Text, useColorModeValue, Alert, AlertIcon, AlertTitle, AlertDescription, Spinner, FormControl, Input } from '@chakra-ui/react'
import React, { useContext, useEffect, useState, FormEvent } from "react";
import AuthContext from "../context/AuthContext"
import { useSearchParams } from "react-router-dom"

type Props = {
	id: string,
	setLog: (param:any) => void
};

const login = async (code: string | null) => {
	const response = await fetch(`${process.env.REACT_APP_URL}/api/auth/token/${code}`, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
		},
	});
	if (!response.ok) {
		return {
			error: response.status.toString(),
			error_description: `${response.statusText ? response.statusText : 'Server error'}`
		};
	}
	const data = await response.json();
	if (data.request_token !== undefined)
		localStorage.setItem('jwt_token', data.request_token);
	return data;
};

const TwoFa = ({id, setLog}: Props)  => {

	const [code, setCode] = useState<string>('');
	const [alert, setAlert] = useState<null | any>(null);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) =>{
		event.preventDefault();
		let res:Response = await fetch(`${process.env.REACT_APP_URL}/api/auth/twofactor/verif`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({id: id, code: code})
		})
		let responseData = await res.json();
		if (!res.ok)
			setAlert({type: 'error', message: 'Server error'})
		else if (responseData?.error) {
			setAlert({type: 'error', message: responseData.error})
		}
		else if (responseData?.request_token) {
			window.localStorage.setItem('jwt_token', responseData.request_token);
			setLog({token: responseData.request_token});
		}
	}
	return (
		<Flex
		minH={'100vh'}
		align={'center'}
		justify={'center'}
		bg={useColorModeValue('gray.50', 'gray.800')}>
			<Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
				<Stack align={'center'}>
					<Heading fontSize={'4xl'}>Google 2FA</Heading>
				</Stack>
				<Box
				rounded={'lg'}
				bg={useColorModeValue('white', 'gray.700')}
				boxShadow={'lg'}
				p={8}>
					<Stack spacing={4}>
						<form onSubmit={handleSubmit}>
							<FormControl id="code">
							<Input my={1} type="password" value={code} onChange={(e: any)=>{setCode(e.target.value)}} />
							</FormControl>
							<Stack spacing={10}>
							<Button my={1}
								bg={'blue.400'}
								color={'white'}
								_hover={{
								bg: 'blue.500',
								}}
								type='submit'>
								Submit
							</Button>
							</Stack>
						</form>
						{alert ?
							<Alert m='auto' p='auto' bg='red.400' status={alert.status} variant='solid' borderRadius={7}>
								<AlertIcon />
								<AlertDescription>{alert.message}</AlertDescription>
							</Alert>
						: null}
					</Stack>
				</Box>
			</Stack>
		</Flex>
	);
}

export default function Login() {
	const [searchParams] = useSearchParams();
	const [error, setError] = useState<null | any>(null);
	const [,setLog] = useContext(AuthContext);
	const [twoFactor, setTwoFactor] = useState<null | string>(null);
	const code = searchParams.get("code");
	const color = useColorModeValue('white', 'gray.700');
	const gray = useColorModeValue('gray.50', 'gray.800');
	useEffect(() => {
		if (code) {
			login(code).then((res) => {
				if (res?.request_token) {
					setLog({token: res?.request_token, firstTime: res?.firstTime})
				}
				else if (res?.id) {
					setTwoFactor(res.id);
				}
				else if (res.error !== undefined && res.error_description !== undefined) {
					setError({error: res.error, error_description: res.error_description});
				}
			})
		}
		else if (searchParams.get("error")) {
			setError({error: searchParams.get("error"), error_description: searchParams.get("error_description")})
		}
	//eslint-disable-next-line
	},[])

	if (twoFactor) {
		return <TwoFa id={twoFactor} setLog={setLog}/>
	}
	else {
		return (
			<Flex minH={'100vh'} align={'center'} justify={'center'} bg={gray}>
				{ code && !error ?
					<Spinner />
					:
					<Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
						<Stack align={'center'}>
							<Heading fontSize={'4xl'}>Sign in to your account</Heading>
							<Text fontSize={'lg'} color={'gray.600'}>
								to enjoy all of our cool features ✌️
							</Text>
						</Stack>
						<Box rounded={'lg'} bg={color} boxShadow={'lg'} p={8}>
							<Stack spacing={4}>
								<Stack spacing={10}>
									<Button as="a"
										href={`${process.env.REACT_APP_OAUTH}`}
										color={'white'} _hover={{textDecoration: 'none', bg: 'blue.500'}}>
										Sign in with 42
									</Button>
								</Stack>
								{ error &&
									<Alert  bg='red.400' borderRadius='md' status='error'>
										<AlertIcon />
										<AlertTitle>{error.error}</AlertTitle>
										<AlertDescription>{error.error_description}</AlertDescription>
									</Alert>
								}
							</Stack>
						</Box>
					</Stack>
				}
			</Flex>
		);
	}
}
