import { Flex, Image, ListItem, UnorderedList } from "@chakra-ui/react"

const Home = () => {
	return (
	<Flex p='10' gap='30' h='full' w='full' flexDir='column'>
		<Flex>
			Pong is a two-dimensional sports game that simulates table tennis,
			manufactured by Atari and originally released in 1972.
		</Flex>
		<Flex>
			<Image borderRadius='md' src='/preview.gif' alt='preview' />
		</Flex>
		<Flex>
		<UnorderedList>
			<ListItem>Controls the paddle by moving it vertically across the left or right side of the screen.</ListItem>
			<ListItem>You compete against another player controlling a second paddle on the opposing side.</ListItem>
			<ListItem>Use the paddles to hit a ball back and forth.</ListItem>
			<ListItem>The goal is to reach eleven points before the opponent.</ListItem>
			<ListItem>Points are earned when one fails to return the ball to the other.</ListItem>
		</UnorderedList>
		</Flex>
	</Flex>
	);
}
export default Home;