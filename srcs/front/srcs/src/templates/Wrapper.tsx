import { Grid, GridItem } from '@chakra-ui/react'
import AuthContext from '../context/AuthContext'
import { ProTipsBody } from '../modals/Bodies'
import { useContext, useState } from 'react'
import GenericModal from './GenericModal'
import NavBar from '../menus/NavBar'
import Chat from '../pages/Chat'

const Wrapper = ({children}: any) => {

	const [,,log] = useContext(AuthContext);
	const [tips, setTips] = useState<null | boolean>(log?.firstTime);

	return (
	<Grid h='100vh' textStyle='p' gap='3'
	templateAreas={{base:`"navbar" "menu"`, md:`"navbar navbar" "menu chat"`}}
	gridTemplateColumns={{base: '1fr', md: '2fr 1fr'}}
	gridTemplateRows={{base:'70px 1fr'}}>
		<GridItem pl='5' pr='5' bg='black' area={'navbar'}>
			<NavBar/>
		</GridItem>
		<GridItem id="wrap" p='5' mb='5' mr='2' ml='2' borderRadius='md' bg='grey.transparent' area={'menu'}>
			{children}
		</GridItem>
		<GridItem p='5' mb='5' mr='2' ml='2' borderRadius='md' display={{base:'none', md:'block'}} bg='grey.transparent' area={'chat'}>
			<Chat/>
		</GridItem>
		{ tips ? <GenericModal name={'Hello new guy'} show={tips} setter={setTips} children={<ProTipsBody />}/> : <></> }
	</Grid>
	);
}
export default Wrapper;
