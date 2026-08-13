declare module '*.png' {
	const asset: number;
	export default asset;
}

declare module '*.jpg' {
	const asset: number;
	export default asset;
}

declare module '*.jpeg' {
	const asset: number;
	export default asset;
}

declare module '*.mp3' {
	const asset: number;
	export default asset;
}

declare module '*.ttf' {
	const asset: number;
	export default asset;
}

declare module '*.css';

declare module '*.module.css' {
	const classes: Record<string, string>;
	export default classes;
}
