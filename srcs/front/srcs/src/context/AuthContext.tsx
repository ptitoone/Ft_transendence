import React, { useState, useEffect, createContext } from 'react'
import { useNavigate } from 'react-router-dom'
import useProfil from '../hooks/useProfil'
import Login from '../pages/Login'

type logContextType = {
	token: null | string,
	firstTime?: boolean,
};

const AuthContext = createContext<Array<any>>([]);

export const AuthProvider = ({children}: any) => {
	const [currentLog, setCurrentLog] = useState<logContextType>({token: window.localStorage.getItem('jwt_token')});
	const { error, isValidating } = useProfil();
	const navigate = useNavigate();

	const logout = () => {
		localStorage.removeItem('jwt_token');
		setCurrentLog({token: null});
		return navigate("/");
	};

 	useEffect(() => {
		if (error !== undefined && !isValidating && currentLog?.token)
			logout();
	}, [error, isValidating, currentLog]);

	return (
		<AuthContext.Provider value={[logout, setCurrentLog, currentLog]}>
			{ currentLog?.token ? children : <Login />}
		</AuthContext.Provider>
	);
};

export default AuthContext;
