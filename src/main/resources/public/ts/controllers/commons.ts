export type TimelineModel = {
	_id: string;
	myRights: any;
	selected: boolean
	icon: string
	modified: { $date: number }
	showButtons: boolean
	events: EventsModel
	headline: string
	text: string
	owner: { userId: string, displayName: string };
	toJSON(): any;
	open(success: () => void, err?: () => void): void;
	addEvent(event: EventModel, finish?: () => void): void;
	save(finish?: () => void): void;
	sync(finish?: () => void): void;
	behaviours(a?:any): any
}
export type TimelinesModel = {
	all: TimelineModel[]
	deselectAll(): void
	sync(finish?: () => void): void;
	forEach(cb?: (value: TimelineModel, key?: number) => void): void;
	removeSelection(cb: () => void): void
}
export type EventsModel = {
	sync(finish?: () => void): void;
	forEach(cb?: (value: TimelineModel, key?: number) => void): void;
	removeSelection(cb: () => void): void
}
export type EventModel = {
	_id: string
	enableEndDate: boolean
	headline: string
	error: string
	img: string
	dateFormat: "day" | "year" | "month"
	startDate: any//Moment
	endDate: any//moment
	video: string
	mediatype: "video" | "img"
	save(finish?: () => void): void;
	sync(finish?: () => void): void;
}