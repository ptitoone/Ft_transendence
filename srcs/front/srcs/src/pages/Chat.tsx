import { SimpleGrid, Text, Flex, Box, Spacer } from '@chakra-ui/react'
import GenericModal from '../templates/GenericModal'
import { AddChannelBody } from '../modals/Bodies'
import { AvatarMenu } from '../menus/AvatarMenu'
import useChannels from '../hooks/useChannels'
import { AddIcon } from '@chakra-ui/icons'
import useUsers from '../hooks/useUsers'
import { useState } from 'react'

const MappedData = (props: any) => {
	return (
	props.data.map((el: any) => {
		return (
		<Flex key={el.id} h='50px' p='2' border='1px solid rgb(192,192,192, 0.2)' bg='rgba(119,136,153,0.3)' borderRadius='md' alignItems='center'>
			<AvatarMenu id={el.id} avatar={el.avatar} status={el.status} who={'player'}/>
			<Text m='1'>{el.username}</Text>
		</Flex>
		);
	}));
};

const MappedData2 = (props: any) => {
	return (
	props.data.map((el: any) => {
		return (
		<Flex key={el.id} h='50px' p='2' border='1px solid rgb(192,192,192, 0.2)' bg='rgba(119,136,153,0.3)' borderRadius='md' alignItems='center'>
			<Flex>
				<AvatarMenu id={el.id} avatar={el.ownerAvatar} users={el.users} who={'channel'} name={el.name}/>
			</Flex>
			<Text m='1'>{el.name}</Text>
		</Flex>
		);
	}));
};

const PlayersList = () => {

	const { users } = useUsers();

	return (
	<Box>
		<Flex>
			<Text>User list</Text>
		</Flex>
		<Flex p='1' h="xs" border='3px solid rgb(192,192,192, 0.2)' borderRadius={4} overflowY='scroll' gap='1' flexDirection='column'>
			{ users ? <MappedData data={users}/> : <></>}
		</Flex>
	</Box>
	);
};

const ChannelList = () => {

	const [show, setShow] = useState<boolean>(false);
	const { channels } = useChannels();

	return (
	<Box>
		<Flex>
			<Text>Channel list</Text>
			<Spacer/>
			<AddIcon cursor='pointer' onClick={() => { setShow(true) }}/>
		</Flex>
		<Flex p='1' h="xs" border='3px solid rgb(192,192,192, 0.2)' borderRadius={4} overflowY='scroll' gap='1' flexDirection='column'>
			{ channels ? <MappedData2 data={channels}/> : <></> }
		</Flex>
		{ show ? <GenericModal name={'Create a new channel'} show={show} setter={setShow} children={<AddChannelBody />}/>:<></> }
	</Box>
	);
};

const Chat = () => {
	return (
	<SimpleGrid templateRows={`1fr 1fr`} w='full' columns={1} spacing='5'>
		<PlayersList />
		<ChannelList />
	</SimpleGrid>
	);
};

export default Chat;
