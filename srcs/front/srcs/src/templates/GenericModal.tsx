import { Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton, ModalHeader } from '@chakra-ui/react';
import { useDisclosure, Flex } from '@chakra-ui/react';

type ModalProps = {
	name: string;
	show: boolean;
	children: any; //change
	setter: (prop: boolean) => void;
};

const GenericModal = (props: ModalProps) => {

	const { isOpen, onClose } = useDisclosure({
		isOpen: props.show,
		onClose: () => { props.setter(false); }
	});

	return (
	<Modal blockScrollOnMount={false} isOpen={isOpen} onClose={onClose}>
		<ModalOverlay />
		<ModalContent>
			<ModalHeader>{props.name}</ModalHeader>
			<ModalCloseButton />
			<ModalBody as={Flex} gap='3' flexDirection='column'>
				{props.children}
			</ModalBody>
		</ModalContent>
	</Modal>
	);
};

export default GenericModal;