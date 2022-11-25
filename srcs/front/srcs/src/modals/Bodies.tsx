import { Alert, AlertIcon, AlertDescription, Avatar, Text, Spacer, Switch, Input, Button, Flex, Center, Box, List, ListItem, UnorderedList, Stack, FormControl } from '@chakra-ui/react';
import { useState, useContext, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGamepad, faHandshake } from "@fortawesome/free-solid-svg-icons";
import SocketContext from '../context/SocketContext'
import useFriends from '../hooks/useFriends'
import useProfil from '../hooks/useProfil'
import useChannels from '../hooks/useChannels';

export const ProTipsBody = () => {
	return (
		<Flex>
			<UnorderedList>
				<ListItem>THINK ABOUT YOUR PRIVACY</ListItem>
				<Text>go to your settings for change your username and activate 2FA</Text>
				<ListItem>KEEP IT REAL</ListItem>
				<Text>change your avatar! just click on it</Text>
			</UnorderedList>
		</Flex>
	);
};

export const UploadBody = () => {

	const [alert, setAlert] = useState<null | any>(null);
	const { profil, mutate } = useProfil();

	const handleSubmit = async (event: any) => {
		event.preventDefault();

		let file = event.target[0].files[0];
		if (file && file.name && (file.name.endsWith('.png') || file.name.endsWith('.jpeg') || file.name.endsWith('.jpg'))) {

			const formData = new FormData();
			formData.append('file', file, file.name);
			let res: Response = await fetch(`${process.env.REACT_APP_URL}/api/users/avatar`, {
				method: "POST",
				headers: {
					'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`,
				},
				body: formData,
			});
			const responseData = await res.json();
			if (!res.ok && res.status === 401)
				mutate();
			if (!res.ok || responseData?.error) {
				setAlert({ status: 'error', message: `${profil?.error || 'Server error'}` })
			}
			else {
				setAlert({ status: 'success', message: 'image was sucessfully updated' });
				mutate({ ...profil, avatar: responseData.avatar }, { revalidate: false });
			}
		}
		else
			setAlert({ status: 'error', message: 'No file or bad file' });
	}

	return (
	<>
		<form onSubmit={handleSubmit}>
			<input type="file" />
			<Button type='submit' colorScheme='blue' mr={3}>Submit</Button>
		</form>
		{ alert ?
			<Alert status={alert.status} variant='solid' borderRadius={7}>
				<AlertIcon />
				<AlertDescription>{alert.message}</AlertDescription>
			</Alert>
			: null
		}
	</>
	);
};

export const FriendReqBody = ({requests, counter, setRequests}: {requests: any, counter: any, setRequests: any}) => {

	const {profil} = useProfil()
	const {mutateFriends} = useFriends(profil?.id);
	const [socket] = useContext(SocketContext);
	const navigate = useNavigate();


	const acceptReq = async(id: number, type:string) => {
		
		if (type === 'FRIEND') {
			const res = await fetch(`${process.env.REACT_APP_URL}/api/users/friends`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
				},
				body: JSON.stringify({requestId: id})
			});

			if (res.ok) {
				setRequests((friends: any) => friends.filter((el: any) => el.id !== id));
				counter((e: number) => e - 1);
				mutateFriends();
			}
		
		} else {
			socket.emit('gamerequest', {id: id, accept: 'Accept'});
			setRequests((friends: any) => friends.filter((el: any) => el.id !== id))
			counter((e: number) => e - 1)
			navigate(`/play?requestId=${id}`);
		}

		
		
	}

	const denyReq = async(id: number, type:string) => {
		if (type === 'FRIEND')
		{
			const res = await fetch(`${process.env.REACT_APP_URL}/api/users/request/${id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
				},
			});
			if (res.ok) {
				setRequests((friends: any) => friends.filter((el: any) => el.id !== id))
				counter((e: number) => e - 1)
			}
		}
		else {
			socket.emit('gamerequest', {id: id, accept: 'Deny'});
			setRequests((friends: any) => friends.filter((el: any) => el.id !== id))
			counter((e: number) => e - 1)
		}
	}
	
	return (
	<Flex h='xs' p='1' overflowY='scroll' gap='1' flexDirection='column'>
		{ requests?.map(({sender, id, type} : any) => {
			return (
			<Flex key={id} h='50px' gap='2' p='2'  border='1px solid rgb(192,192,192, 0.2)' bg='rgba(119,136,153,0.3)' borderRadius='md' alignItems='center'>
				<Avatar ignoreFallback={true} src={`data:image/;base64,${sender.avatar}`} size='sm' />
				<Text>{sender.username}</Text>
				<FontAwesomeIcon icon={type === 'FRIEND' ? faHandshake : faGamepad} />
 				<Spacer />
				<CheckIcon cursor='pointer' onClick={() => acceptReq(id, type)}/>
				<CloseIcon cursor='pointer'  onClick={() => denyReq(id, type)}/>
			</Flex>
			);
		})}
	</Flex>
	);
};

export const PassBody = ({id, setter}: {id: number, setter: any}) => {
	
	const ref = useRef<HTMLInputElement>(null);
	const [alert, setAlert] = useState<null | any>(null);

	const fetchPassword = async (e:any) => {
		e.preventDefault();
		if (ref.current && ref.current.value)
		{
			const res = await fetch(`${process.env.REACT_APP_URL}/api/channel/${id}/auth`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
				},
				body: JSON.stringify({password: ref.current.value})
			});
			if (res.ok)
			{
				let data = await res.json();
				if (data.res) 
					setter(true);
				else
					setAlert({status:'error', description: 'wrong password'}) 
			}
			else
				setAlert({status:'error', description: 'wrong password'})
			ref.current.value = '';
		} 
	}

	return (
		<Center>
			<form onSubmit={fetchPassword}>
				<FormControl p={2}>
					<Input ref={ref} my={1} type='password' placeholder='type channel password'/>
					<Center my={1}>
						<Button type='submit' colorScheme='blue'>login</Button>
					</Center>
				</FormControl>
			</form>
			{alert ?
			<Alert my={1} status={alert.status} variant='solid' borderRadius={7}>
				<AlertIcon />
				<AlertDescription>{alert.description}</AlertDescription>
			</Alert> : null
			}
		</Center> 
	);
};

export const AdminPanelBody = ({id, setValidPass}: {id: number, setValidPass: (valid:boolean) => void}) => {

	const [user, setUser] = useState<{username: string, id: number} | null>(null)
	const [foundUsers, setFoundUsers] = useState<any[]>([]);
	const passRef = useRef<HTMLInputElement>(null);
	const [alert, setAlert] = useState<any | null>(null)
	const [isOwner, setIsOwner] = useState<boolean>(false);
	const {mutate} = useChannels();
	
	const fetchListandOwner = async () => {
		const res = await fetch(`${process.env.REACT_APP_URL}/api/channel/${id}/search`, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
			},
		});
		if (res.ok) {
			let data = await res.json();
			setFoundUsers(data.users);
			setIsOwner(data.owner);
		}
	};
	
	const handleMethod = async (method:string) => {
		if (user)
		{
			const res = await fetch(`${process.env.REACT_APP_URL}/api/channel/${id}/${method}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
				},
				body: JSON.stringify({id: user.id})
			});
			if (res.ok) {
				let data = await res.json();
				if (data?.success) {
					setAlert({status: 'success', description: data?.success})
					if (method === 'ban') {
						setFoundUsers((prev: any[])=> prev.filter((el:any)=> el.id !== user.id))
						mutate();
					}
				}
				else if(data?.error) {
					setAlert({status: 'error', description: data?.error})
				}
			}
			else
				setAlert({status: 'error', description: 'Server error'})
		}
	}

	const passwordChange = async (e:any) => {
		e.preventDefault();
		if (passRef.current && passRef.current?.value)
		{
			const res = await fetch(`${process.env.REACT_APP_URL}/api/channel/${id}/changePassword`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
				},
				body: JSON.stringify({password: passRef.current.value})
			});
			if (res.ok)
			{
				let data = await res.json();
				if (data?.error)
					setAlert({status: 'error', description: data?.error})
				else
					setAlert({status: 'success', description: 'password successfully updated'})
			}
			else
				setAlert({status: 'error', description: 'server error'})
			passRef.current.value = '';
		}
	}
	
	useEffect(()=> {
		fetchListandOwner().then();

		return () => {
			setValidPass(false);
		}
	},[])

	return (
	<>	
		{user ? <Button cursor='unset' _hover={{background: 'grey'}} size='md' key={user?.id}>{user?.username}</Button> :null}
		<Flex h='70px' overflowY='scroll'>
			<List my={1}>
				{foundUsers?.map((el: {username: string, id: number}) => {
					return <ListItem cursor='pointer' key={el.username} pl={2} onClick={(e:any)=> {setUser(el)}} borderRadius={2} _hover={{backgroundColor: "#718096",}}>{el.username}</ListItem>
				})}
			</List>
		</Flex>
 		<Center gap={2}>
			{ isOwner ? <Button variant='solid' color='white' colorScheme='green' onClick={(e:any) => handleMethod('admin')}>set admin</Button> : null}
			<Button variant='solid' color='lighgray' colorScheme='orange' onClick={(e:any) => handleMethod('mute')}>mute user</Button>
			<Button variant='solid' color='white' colorScheme='red' onClick={(e:any) => handleMethod('ban')}>ban user</Button>
		</Center>
		{ isOwner ?
			<form onSubmit={passwordChange}>
				<FormControl p={2}>
					<Input ref={passRef} my={1} type='password' placeholder='type password here'/>
					<Center my={1}>
						<Button type='submit' colorScheme='blue'>set password</Button>
					</Center>
				</FormControl>
			</form>
		:null
		}
		{alert ?
			<Alert my={3} status={alert.status} variant='solid' borderRadius={7}>
			<AlertIcon />
			<AlertDescription>{alert.description}</AlertDescription>
			</Alert> : null
		} 
	</>
	);
};

export const AddChannelBody = () => {

	const [name, setName] = useState<string>('');
	const [pass, setPass] = useState<string>('');
	const [users, setUsers] = useState<any[]>([]);
	const [visibility, setVisibility] = useState<boolean>(true);
	const [foundUsers, setFoundUsers] = useState<any[] | null>(null);
	const [alert, setAlert] = useState<null | any>(null);
	const ref = useRef<HTMLInputElement>(null);
	const {mutate} = useChannels();

	const handleSubmit = async (e: any) => {
		e.preventDefault();
		let type;
		let filterid: any[] = users.map((el:any) => {return {id: el.id}});
		visibility ? type = 'PUBLIC' : type = 'PRIVATE';
		const res = await fetch(`${process.env.REACT_APP_URL}/api/channel/create`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
			},
			body: JSON.stringify({ name: name, password: pass, users: filterid, type: type})
		});
		if (!res.ok)
			setAlert({status: 'error', description: 'Servor Error'})
		else {
			let data = await res.json();
			if (data?.error)
				setAlert({status: 'error', description: data?.error})
			else {
				setAlert({status: 'success', description: `Channel ${name} successfully created`});
				mutate();
			}
		}
	};

	const handleChange = async (e: any) => {
		if (e.target.value) {
			const res = await fetch(`${process.env.REACT_APP_URL}/api/users/search`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
				},
				body: JSON.stringify({ username: e.target.value })
			});
			if (res.ok) {
				let data = await res.json();
				setFoundUsers(data);
			}
		}
		else
			setFoundUsers(null);
	};

	const onUserClick = (e:any, el:any) => {
		if (ref.current)
			ref.current.value = '';
		setFoundUsers(null);
		if (!users.find((friend:any)=> friend.id === el.id))
			setUsers((prev: any) => [...prev, el])
	}

	const removeUser= (e:any, el:any) => {
		setUsers((prev:any)=> {
			return prev.filter((user: any)=> user.id !== el.id);
		})
	}

	return (
	<>
		<Flex>
			Public channel:
			<Switch  defaultChecked={true} onChange={()=>setVisibility((prev: boolean)=> !prev)} pl='3' />
		</Flex>
		<form onSubmit={handleSubmit}>
			<FormControl>
			<Input my={1}  type="text" placeholder="type name here" onChange={(e: any) => { setName(e.target.value) }} />
			<Input my={1} type="password" placeholder="type password here" onChange={(e: any) => { setPass(e.target.value) }} />
			<Input my={1} ref={ref} type="text" placeholder="add user here" onChange={handleChange} />
			<Stack my={1} isInline spacing={3} align="center">
				{users.map((el: any)=> {
					return (<Button onClick={(e:any)=> removeUser(e, el)} _hover={{background: 'red.500'}} size='xs' key={el.id}>{el.username}</Button>);
				})}
			</Stack>
			<List my={1}>
				{foundUsers?.map((el: any) => {
					return <ListItem cursor='pointer' key={el.username} pl={2} onClick={(e:any)=> onUserClick(e,el) }  borderRadius={2} _hover={{backgroundColor: "#718096",}}>{el.username}</ListItem>
				})}
			</List>
			<Center>
				<Button type='submit' colorScheme='blue'>create</Button>
			</Center>
			</FormControl>
		</form>
		{alert ?
			<Alert my={3} status={alert.status} variant='solid' borderRadius={7}>
			<AlertIcon />
			<AlertDescription>{alert.description}</AlertDescription>
			</Alert> : null
		}
	</>
	);
};

export const ChatBody = ({id, name, setValidPass}: {id: number, name?: string, setValidPass?: (valid: boolean)=>void}) => {

	const [history, setHistory] = useState<any[]>([]);
	const [socket] = useContext(SocketContext);
	const el = document.getElementById('chat');
	const ref = useRef<HTMLInputElement>(null);
	const [blockIds, setBlockIds] = useState<null | number[]>(null);

	const fetchBlockIds = async () => {

		const res = await fetch(`${process.env.REACT_APP_URL}/api/users/blockeds`, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
			},
		});
		if (res.ok) {
			let data = await res.json();
			setBlockIds(data);
		}
	};

	const handleMessage = useCallback( (data: any) => {
		if ((!blockIds && !name) || (blockIds && name))
		{	
			if ((data.chanId && data.chanId === id && blockIds && !(blockIds.find((id:number) => id === data.sender)) )  || (!data.chanId && (data.receiver === id || data.sender === id)))
				setHistory((prev: any) => [...prev, {username: data.username, content: data.content}]);
		}
	}, [setHistory, blockIds]);

	

	const fetchMessages = useCallback(async(id: number, name?: string) => {

		const path = name ? 'channel' : 'dm';
		const res = await fetch(`${process.env.REACT_APP_URL}/api/message/${path}/${id}`, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
			},
		});
		if (res.ok) {
			let data = await res.json();
			if (!data.error)
				setHistory(data);
		}
	}, [id]);

	const handleSubmit = (e: any) => {
		e.preventDefault();
		if(ref.current && ref.current?.value.trim().length) {
			socket.emit('message', {content: ref.current.value, id: id, name: name });
			ref.current.value = '';
		}
	}

	useEffect(() => {
		if (el)
			el.scrollTop = el.scrollHeight;
	});

	useEffect(() => {
		fetchMessages(id, name).then();
		if (name)
			socket.emit('joinroom', {name: name, id: id});
	}, [socket, fetchMessages]);

 	useEffect(() => {
		socket.on('message', handleMessage)
	}, [handleMessage]);

	useEffect(() => {
		if (name && setValidPass) {
			fetchBlockIds().then();
			return () => {
				setValidPass(false);
			}
		}
	}, []);

	return (
	<>
		<Box id='chat' border='solid grey' borderRadius={4} p={2} h='sm' overflowY='scroll'>
		{
			history.map((el: any, id:number) => {
				return (
				<Flex key={id}>
					<Text>{el.username} : {el.content}</Text>
				</Flex>);
			})
		}
		</Box>
		<form onSubmit={handleSubmit}>
			<Input ref={ref} type="text" placeholder="message here"/>
			<Button my={2} type='submit'>Send</Button>
		</form>
	</>
	);
};