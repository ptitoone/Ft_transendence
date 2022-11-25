import { useDisclosure, Avatar, AvatarBadge, AvatarGroup, MenuDivider, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import { AdminPanelBody, ChatBody, UploadBody, PassBody } from '../modals/Bodies'
import { useState, useContext, useEffect, useCallback } from 'react'
import SocketContext  from '../context/SocketContext'
import GenericModal from '../templates/GenericModal'
import AuthContext from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import useFriends from '../hooks/useFriends'
import useProfil from '../hooks/useProfil'
import useChannels from '../hooks/useChannels';
import useUsers from '../hooks/useUsers'

type AvatarMenuProps = {
	id: number;
	name?: string;
	avatar: string;
	status?: string;
	users?: Array<any>;
	who: 'me' | 'player' | 'friend' | 'channel';
};

const PlayerMenu = ({id, status, chatter}: {id: number, status?: string, chatter: any}) => {

	const {profil} = useProfil();
	const {friends,mutateFriends} = useFriends(profil?.id);
	const {users} = useUsers();
	const navigate = useNavigate();
	const [socket] = useContext(SocketContext);
	const [isBlocked, setBlocked] = useState<boolean>(false);
	let user = users?.find((el:any) => el.id === id);
	

	const fetchBlock = async(id: number) => {
		const res = await fetch(`${process.env.REACT_APP_URL}/api/users/block/${id}`, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
			},
		});
		if (res.ok) {
			let data = await res.json();
			if (data?.res !== isBlocked)
				setBlocked(data?.res);
		}
	};

	const blockPlayer = async(id: number) => {
		const res = await fetch(`${process.env.REACT_APP_URL}/api/users/block`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
			},
			body: JSON.stringify({ id: id})
		});
		if (res.ok){
			let data = await res.json();
			if (data)
				setBlocked(true);
		}
	};

	const unblockPlayer = async(id: number) => {
		const res = await fetch(`${process.env.REACT_APP_URL}/api/users/unblock`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
			},
			body: JSON.stringify({ id: id})
		});
		if (res.ok){
			let data = await res.json();
			if (data)
				setBlocked(false);
		}
	};

	const unFriend = async(id: number) => {
		const res = await fetch(`${process.env.REACT_APP_URL}/api/users/friends/${id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
			},
		});
		if (res.ok && (await res.json() === true)) {
			mutateFriends();
		}
	}

	const addFriend = async(id: number) => {
		const res = await fetch(`${process.env.REACT_APP_URL}/api/request/create/friend`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
			},
			body: JSON.stringify({ id: id})
		});
		if (res.ok){
			let data = await res.json();
			if (profil && !data?.error) {
				mutateFriends();
				socket.emit('request', {to: id});
			}
		}
	};

	const gameRequest = async(id: number) => {
		const res = await fetch(`${process.env.REACT_APP_URL}/api/request/create/game`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
			},
			body: JSON.stringify({id: id})
		});
		if (res.ok) {
			let data = await res.json()
			if (!data?.error)
				navigate(`/play?guest=${id}&requestId=${data.id}`)
		}
	}

	const spectateGame = async (id: number) => {
		const res = await fetch(`${process.env.REACT_APP_URL}/api/games/spectate/${id}`, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
			},
		});
		if (res.ok) {
			let data = await res.json();
			if (data)
				navigate(`/play?gameId=${data}&spectate=true`);
		}
	};

	useEffect(() => {
		fetchBlock(id).then();
	}, []);

	return (
	<>
		<MenuItem onClick={()=> navigate(`/profile?id=${id}`)}>see profile</MenuItem>
		<MenuItem onClick={() => { chatter(true) }}>send message</MenuItem>
		{ friends?.find((el: any)=> el.id === id) ?
			<MenuItem onClick={(e: any) => unFriend(id)}>unfriend</MenuItem>
			:
			<MenuItem onClick={(e: any) => addFriend(id)}>addfriend</MenuItem>
		}
		{ user?.status === 'ingame' ? <MenuItem onClick={() => {spectateGame(id)}}>spectate game</MenuItem> : null }
		{status === 'online' ? <MenuItem onClick={() => gameRequest(id)}>invite in game</MenuItem> : null }
		{ isBlocked === false ?
			<MenuItem onClick={ () => { blockPlayer(id); }}>block</MenuItem>
			: 
			<MenuItem onClick={ () => { unblockPlayer(id); }}>unblock</MenuItem>
		}
	</>
	);
};

const MeMenu = ({setter}: {setter: any}) => {

	const [logout,] = useContext(AuthContext);

	return (
	<>
		<MenuItem onClick={() => { setter(true) }}>Change avatar</MenuItem>
		<MenuDivider/>
		<MenuItem onClick={logout}>Logout</MenuItem>
	</>
	);
};

const ChannelMenu = ({id, chatter, manager, protecter, pass}: {id: number, chatter: any, manager: any, protecter: any, pass: any}) => {

	const [channelData, setChannelData] = useState<any>({isAdmin: false, isBan: false, isIn: false})
	const {mutate} = useChannels();

	const fetchInfo = useCallback(async(id: number) => {
		const res = await fetch(`${process.env.REACT_APP_URL}/api/channel/${id}`, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
			},
		});
		if (res.ok) 
		{	
			let data = await res.json();
			setChannelData({isAdmin: data?.admin, isBan: data?.banned, isIn: data?.isIn})
			if (data.password) {
				protecter(true);
			}
		}
	}, [setChannelData, protecter, id]);

	const handleLeave = useCallback(async (id: number) => {
		const res = await fetch(`${process.env.REACT_APP_URL}/api/channel/${id}/leave`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
			},
		});
		if (res.ok)
		{	
			let data = await res.json();
			if (data?.res) {
				setChannelData((prev:any) =>{ return {...prev, isIn: false}});
				mutate();
			}
		}
	}, [setChannelData,id]);

	useEffect(() => {
		fetchInfo(id).then();
	}, [fetchInfo]);

	return (
	<>
		{ channelData.isBan === false ?
		<>
			<MenuItem onClick={() => { chatter(true); pass(true);}}>send message</MenuItem>
			{ channelData.isIn === true ? <MenuItem onClick={(e: any) => {handleLeave(id)} }>leave channel</MenuItem> : null }
			{ channelData.isAdmin === true ? <MenuItem onClick={() => { manager(true); pass(true); }}>manage channel</MenuItem> : null }
		</> : <MenuItem color='red.500'>BANNED</MenuItem>
		}
	</>
	);
};

const AvatarIcons = ({avatar, users}: {avatar: string, users: any}) => {
	return (
	<AvatarGroup spacing={'-0.70em'} size={'sm'} max={1}>
	{
		users.map((el: any) => {
			return (
				<Avatar key={el.username} src={`data:image/;base64,${avatar}`}/>
			);
		})
	}
	</AvatarGroup>
	);
};

export const AvatarIcon = ({id, avatar, status, who}: AvatarMenuProps) => {

	const [color, setColor] = useState<string>((who === 'me' && status === 'offline' ? 'green' : (status === 'online' ? 'green' : (status === 'offline') ? 'red' : 'blue')));
	const [socket] = useContext(SocketContext);

	const handleOnline = useCallback((data: number) => {
		if (id === data) {
			setColor('green');
		}
	}, [id, setColor]);

	const handleOffline = useCallback((data: number) => {
		if (id === data) {
			setColor('red');
		}
	}, [id, setColor]);

	const handleIngame = useCallback((data: number) => {
		if (id === data) {
			setColor('blue');
		}
	}, [id, setColor]);

	useEffect(()=> {
			socket.on('online', handleOnline);
			socket.on('ingame', handleIngame);
			socket.on('offline', handleOffline);
	}, [handleOnline, handleOffline, handleIngame]);

	return (
	<Avatar size={(who === 'player' || who === 'channel') ? 'sm' : 'md'} ignoreFallback={true} src={`data:image/;base64,${avatar}`}>
		{ <AvatarBadge bg={color} boxSize='1.25em' /> }
	</Avatar>
	);
};

export const AvatarMenu = ({id, name, avatar, users, status, who}: AvatarMenuProps) => {

	const { isOpen, onOpen, onClose } = useDisclosure();
	const [upload, setUpload] = useState<boolean>(false);
	const [manage, setManage] = useState<boolean>(false);
	const [isPass, setIsPass] = useState<boolean>(false);
	const [pass, setPass] = useState<boolean>(false);
	const [chat, setChat] = useState<boolean>(false);
	const [validPass, setValidPass] = useState<boolean>(false);
	const {mutate} = useChannels();

	return (
	<>
	<Menu isOpen={isOpen} isLazy placement={'bottom'}>
		<MenuButton onMouseEnter={onOpen} onMouseLeave={onClose}>
		{ who === 'channel' ?
			<AvatarIcons avatar={avatar} users={users}/> :
			<AvatarIcon id={id} who={who} avatar={avatar} status={status}/>
		}
		</MenuButton>
		<MenuList onClick={onClose} onMouseEnter={onOpen} onMouseLeave={onClose}>
		{
			who === 'me' ? <MeMenu setter={setUpload}/> :
			who === 'player' ? <PlayerMenu id={id} status={status} chatter={setChat}/> :
			who === 'channel' ? <ChannelMenu id={id} chatter={setChat} manager={setManage} protecter={setIsPass} pass={setPass}/> :
			null
		}
		</MenuList>
	</Menu>
	{ (who === 'channel' && ((manage === true || chat === true) && isPass === true)) ?
		<GenericModal name={'Type password'} show={pass} setter={setPass} children={<PassBody id={id} setter={setValidPass}/>}/> 
		: null
	}
	{ chat === true ?
		((isPass === true && validPass === true) || isPass === false) ?
			<GenericModal name={'Chatroom'} show={chat} setter={setChat} children={<ChatBody setValidPass={setValidPass} id={id} name={name}/>}/>
		: null
		: null
	}
	{ manage === true ?
		((isPass === true && validPass === true) || isPass === false) ?
			<GenericModal name={'Manage channel'} show={manage} setter={setManage} children={<AdminPanelBody setValidPass={setValidPass} id={id}/>}/>
		: null
		: null
	}
	{ upload === true ? <GenericModal name={'Select a new avatar'} show={upload} setter={setUpload} children={<UploadBody />}/> : null }
	</>
	);
};
