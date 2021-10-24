import { dateFormat } from '@/utils/tool.js';
// 保存用户
export function saveUser(obj){
	window.localStorage.setItem('storage_user_qingwa', obj);
}
// 获取用户
export function getUser(callback){
	let str = window.localStorage.getItem('storage_user_qingwa')
	if(str){
		return JSON.parse(str);
	}else{
		return null;
	}
}

// 今天剩余次数
export function getTodayLeaveErrorCount(){
	let d = dateFormat(new Date(),"yyyy-MM-dd");
	let str = window.localStorage.getItem('LeaveErrorCount_qingwa'+d)
	if(str){
		return parseInt(str);
	}else{
		window.localStorage.setItem('LeaveErrorCount_qingwa'+d,"5");
		return 5;
	}
}

// 获取用户
export function setTodayLeaveErrorCount(count){
	let d = dateFormat(new Date(),"yyyy-MM-dd");
	window.localStorage.setItem('LeaveErrorCount_qingwa'+d,count+'');
}

// 今天抽奖剩余次数
export function getTodayChouLeaveCount(){
	let d = dateFormat(new Date(),"yyyy-MM-dd");
	let str = window.localStorage.getItem('LeaveChouCount_qingwa'+d)
	if(str){
		return parseInt(str);
	}else{
		window.localStorage.setItem('LeaveChouCount_qingwa'+d,"5");
		return 5;
	}
}

// 获取用户
export function setTodayChouLeaveCount(count){
	let d = dateFormat(new Date(),"yyyy-MM-dd");
	window.localStorage.setItem('LeaveChouCount_qingwa'+d,count+'');
}