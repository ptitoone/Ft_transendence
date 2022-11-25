import { extendTheme } from '@chakra-ui/react'
import bgPattern from './assets/bgPattern.png'
import "@fontsource/alef"
import type { StyleFunctionProps } from '@chakra-ui/styled-system'

const colors = {
  green: {
    'base':'#4CAE32',
  },
  blue: {
    'flash': '#393F9D',
    'light': '#5BB8D5',
  },
  orange: {
    'flash': '#FF7F00',
    'dark': '#D36600',
  },
  grey: {
    'dark': '#202020',
    'light':'#3D3D3D',
    'transparent':'#000000BF',
  },
  gradient: {
    'text':'',
  },
}

const styles = {
    global:{
      body: {
        bgImage: bgPattern,
        bgSize: 'cover',
        bgRepeat: 'repeat-y',
      },
    },
}

const components = {
  Button: {
    baseStyle: {},
    sizes: {},
    variants: {
      outline: (props: StyleFunctionProps) => ({
        borderColor: 'black',
        borderWidth: '1px',
        borderRadius: '5px',
		textDecoration: 'none',
        ml: '3px',
        mr: '3px',
        _hover: {borderColor: 'black', bg: 'green.base',},
      }),
    },
    defaultProps: {},
  },
}


const textStyles = {
    p: {
      color: 'white',
      fontFamily: 'Alef, serif',
      fontWeight: '700',
    },
}
const config = {
  initialColorMode: "dark",
  useSystemColorMode: false,
}
const theme = extendTheme({ colors, styles, textStyles, components, config })

export default theme
