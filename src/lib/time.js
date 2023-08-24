export function convertUnixTimestampToEuropeanTime(unixTimestamp) {
	const dateObject = new Date(unixTimestamp);
	
	const day = dateObject.getDate();
	const month = dateObject.getMonth() + 1; // Months are 0-indexed
	const year = dateObject.getFullYear();
	
	const hours = dateObject.getHours();
	const minutes = dateObject.getMinutes();
	const seconds = dateObject.getSeconds();
	
	return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}
  