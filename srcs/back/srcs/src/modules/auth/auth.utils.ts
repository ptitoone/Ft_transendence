import fetch from 'node-fetch';
import sharp from 'sharp'

class HTTPResponseError extends Error {
  constructor(response) {
    super(`HTTP Error Response: ${response.status} ${response.statusText}`);
    const msg: string = response;
  }
}


const getUserAccessToken = async (uid: string, secret: string, code: string): Promise<any> => {
	let res = await fetch("https://api.intra.42.fr/oauth/token", {
		method: "POST",
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify({
			grant_type: 'authorization_code',
			client_id: uid,
			client_secret: secret,
			code: code,
			redirect_uri: `${process.env.URL}`,
		})
	})
	return res.json();
}

const getUserInformations = async (access_token: string): Promise<any> => {
	let request = await fetch("https://api.intra.42.fr/v2/me", {
		method: "GET",
		headers: {
			'Authorization': `Bearer ${access_token}`,
			'Content-Type': 'application/json'
		}
	})
	return await request.json();
}

const getBase64FromBuffer = async (buffer: Buffer): Promise<string> => {
	const resizedBuffer = await sharp(buffer).resize(
		128, 128,
		{fit: 'cover', withoutEnlargement: true}
	).jpeg({ quality: 50 }).toBuffer();
	return resizedBuffer.toString('base64');
}

const getBase64FromURI = async (uri: string): Promise<string> => {
	const data = await fetch(uri);
	const buffer = await data.buffer();
	return getBase64FromBuffer(buffer);
}

const getTokenId = (token: string): number => {
		let payload64 = token.split('.')[1];
		let buff = new Buffer(payload64, 'base64');
		let payload = JSON.parse(buff.toString());
    return payload.sub;
}

export {
	getUserAccessToken,
	getUserInformations,
	getBase64FromURI,
	getBase64FromBuffer,
  getTokenId,
};
