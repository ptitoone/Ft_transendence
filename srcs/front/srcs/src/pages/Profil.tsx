import { Heading, Avatar, Flex, Text, Center, Badge, Skeleton, SkeletonCircle, Wrap, WrapItem } from '@chakra-ui/react';
import { Tab, Tabs, Spacer, TabList, TabPanel, TabPanels } from '@chakra-ui/react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { AvatarIcon } from '../menus/AvatarMenu'
import useFriends from '../hooks/useFriends'
import useProfil from '../hooks/useProfil'
import useUsers from '../hooks/useUsers';
import {useEffect, useState} from 'react'

const AchievementList = (props: any) => {
	const [achievements, setAchievements] = useState<string[]>([])
	const {friends} = useFriends(props.id);
	const [matchs, setMatchs] = useState<any[]>([]);

	const fetchMatchs = async (id:number) => {
		const res = await fetch(`${process.env.REACT_APP_URL}/api/users/history/${id}`, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
			},
		});
		if (res.ok) {
			let data = await res.json();
			setMatchs(data);
		}
	}

	useEffect(()=>{
		if (props.id && !matchs.length)
			fetchMatchs(props.id).then()
	},[props.id])

	useEffect(()=> {
		let achievs :string[] = []

		achievs.push('Welcome');
		if (friends && friends.length) {
			achievs.push('You are not alone');	
			if (friends.length > 3)
				achievs.push('Sociability')
		}
		if (matchs)
		{
			if (matchs.length)
			{
				achievs.push('Enter in game')
				if (matchs.length >= 7)
					achievs.push('Try hard')
			}
			for (let match of matchs) {
				if (match.win === 'win') {
					achievs.push('Winner')
					break ;
				}
			}
		}
		if (achievs.toString() !== achievements.toString())
			setAchievements(achievs)
	}, [matchs, friends])
	

	return (
	<Flex alignItems='center' flexDir='column'>
		<Wrap justify='center'>
			{achievements.map((achiev: string) => {
				return (
					<WrapItem key={achiev}>
						<Badge px={2} py={1} bg='gray.800'>
							#{achiev}
						</Badge>
					</WrapItem>
				)
			})}
		</Wrap>
	</Flex>
	);
};

const FriendList = (props: any) => {

	const { friends } = useFriends(props.id);
	const {profil} = useProfil();

	if (friends && friends.length) {
		return (
			<>
				<Heading mt='5' fontSize={'2xl'} fontFamily={'body'}>
					Friends
				</Heading>
				<Flex>
					<Wrap justify='center'>
					{
						friends?.map((el: any) => {
						return (
						<WrapItem cursor='pointer' key={el.id} onClick={()=> props.navigate(`/profile?id=${el.id}`)}>
							<Center borderRadius='md' m='1' p='2' w='145px' bg='green.800'>
								<AvatarIcon id={el.id} avatar={el.avatar} status={el.status} who={ profil?.id !== el.id ? 'friend' : 'me'}/>
							</Center>
						</WrapItem>
						);})
					}
					</Wrap>
				</Flex>
			</>
			);
	} else
		return null;	
};

const ProfilStatsList = (props: any) => {

	const { profil, isValidating } = useProfil(props.id);

	return (
	<Flex alignItems='center' flexDir='column'>
	{ !(profil && !isValidating) ?
		<>
		<SkeletonCircle size='28' m='auto'/>
		<Skeleton mx='auto' my='2' width='7vw' height='2vh' borderRadius='7'/>
		<Skeleton mx='auto' my='2' width='2vw' height='1vh' borderRadius='7'/>
		<Skeleton mx='auto' mt='4' mb='2' width='10vw' height='2vh' borderRadius='7'/>
		</>
	:
		<>
		<Avatar size={'xl'} src={`data:image/;base64,${profil.avatar}`} ignoreFallback={true} mb={4}/>
		<Heading fontSize={'xl'} fontFamily={'body'}>
			{profil.username}
		</Heading>
		<Text textAlign={'center'}>
			{profil.elo}
		</Text>
		</>
	}
	</Flex>
	);
};

const OverViewMenu = (props: any) => {

	return (
	<Flex p='5' gap='5' alignItems='center' flexDir='column'>
		<ProfilStatsList id={props.id}/>
		<Heading mt='5' fontSize={'2xl'} fontFamily={'body'}>
			Achievements
		</Heading>
		<AchievementList id={props.id}/>
		<FriendList id={props.id} navigate={props.navigate}/>
	</Flex>
	);
};

const HistoryMenu = (props: any) => {
	const [matchs, setMatchs] = useState<any[]>([]);
	//const navigate = useNavigate();

	const fetchMatchs = async (id:number) => {
		const res = await fetch(`${process.env.REACT_APP_URL}/api/users/history/${id}`, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
			},
		});
		if (res.ok) {
			let data = await res.json();
			setMatchs(data);
		}
	}

	useEffect(()=> {
		fetchMatchs(props.id).then()
	},[props.id])
	
	return (
	<Flex h='xl' borderRadius={7} border='3px solid rgb(192,192,192, 0.2)' p='2' gap='1' overflowY='scroll' flexDirection='column'>
		{	
			
			matchs.map((match:any, index:number)=>{
			return (
				<Flex key={`match${index}`} h='80px' p='2' border='1px solid rgb(192,192,192, 0.2)' bg={match.win === 'win' ? 'rgba(56, 161, 105, 0.5)' : match.win === 'draw' ? 'rgba(49, 130, 206, 0.5)' : 'rgba(229, 62, 62, 0.5)'} borderRadius='md' alignItems='center'>
					<Flex align='center' w='35%' flexWrap='wrap'>
						<WrapItem>
							<Avatar size='md' src={`data:image/;base64,${props.profil?.avatar}`}/>
						</WrapItem>
						<WrapItem>
							<Text ml={2}>{props.profil?.username}</Text>
						</WrapItem>
					</Flex>
 					<Spacer/>
					<Flex gap='1' flexDir='column'>
						<Center>{match.p1Score} : {match.p2Score}</Center>
						<Center>{match.abandon ? 'abandon' : match.win === 'win' ? 'winner' : 'looser'}</Center>
					</Flex>
					<Spacer/>
					<Flex w='35%' align='center' justify='end' flexWrap='wrap-reverse'>
						<WrapItem>
							<Text mr={2}>{match.p2Username}</Text>
						</WrapItem>
						<WrapItem cursor='pointer' onClick={()=> {props.navigate(`/profile?id=${match.userId}`)}}>
							<Avatar size='md' src={`data:image/;base64,${match.p2Avatar}`}/>
						</WrapItem>
					</Flex>
				</Flex>
			)
			})
		}
	</Flex>
	);
}

const LeaderboardMenu = (props: any) => {
	const {profil, mutate} = useProfil();
	const {users} = useUsers();
	const [arr, setArr] = useState<any[] | null>(null);
	
	useEffect(()=> {
		mutate();
	}, []);

	useEffect(()=> {
		if (users)
		{
			let tempUsers = [...users];
			tempUsers?.push(profil);
			setArr(tempUsers?.sort(function(a:any, b:any){
				return b.elo - a.elo;
			}))
		}
	}, [users])
	
	return (
	<>
	<Flex h='xl' borderRadius={7} border='3px solid rgb(192,192,192, 0.2)' p='2' gap='1' overflowY='scroll' flexDirection='column'>
		{arr?.map((user:any) => {
			return (
				<Flex key={user.id} h='80px' p='2' border='1px solid rgb(192,192,192, 0.2)' bg={ user.id === parseInt(props.id) ? `rgba(0,0,139,0.4)` : `rgba(128,128,128,0.4)`} borderRadius='md' alignItems='center'>
					<Avatar  cursor='pointer' onClick={()=> props.navigate(`/profile?${user.id}`)}size='md' src={`data:image/;base64,${user.avatar}`}/>
					<Text p='2'>{user.username}</Text>
					<Spacer/>
					<Text>{user.elo}</Text>
				</Flex>
			)
		})}
	</Flex>
	</>
	);
}

const ProfilContent = () => {

	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	let id = searchParams.get('id');
	const { profil ,error } = useProfil(id);

	if (!id)
		id = profil?.id;
	if (error)
		return (<Text>user doesn't exists</Text>);
	return (
	<Tabs isLazy isFitted variant='enclosed'>
		<TabList>
			<Tab>Overview</Tab>
			<Tab>History</Tab>
			<Tab>Leaderboard</Tab>
		</TabList>
		<TabPanels>
			<TabPanel>
				<OverViewMenu id={id} navigate={navigate}/>
			</TabPanel>
			<TabPanel as={Flex} p='5' flexDirection='column'>
				<HistoryMenu id={id} profil={profil} navigate={navigate}/>
			</TabPanel>
			<TabPanel as={Flex} p='5' flexDirection='column'>
				<LeaderboardMenu id={id} navigate={navigate}/>
			</TabPanel>
		</TabPanels>
	</Tabs>
	);
}

const Profil = () => {
	const { key } = useLocation();

	return <ProfilContent key={key}/>;
}
export default Profil;
