import { Selectable, Model, Selection, Eventer, Mix } from 'entcore-toolkit';
import http from "axios";
import { Shareable, Rights, notify, moment, model } from 'entcore';
import { Folders, Folder, Filters } from './folder';
type TimelineData = {
    icon: string
    created: { $date: number }
    headline: string
    modified: { $date: number }
    owner: { userId: string, displayName: string }
    text: string
    textPlain: string
    type: string
    _id: string
    trashed: boolean
}
export class Timeline extends Model<Timeline> implements Selectable, Shareable {
    static eventer = new Eventer();
    _id: string;
    selected: boolean;
    rights: Rights<Timeline> = new Rights(this);
    owner: { userId: string, displayName: string };
    shared: any;
    trashed: boolean = false;
    headline: string;
    shortenedTitle: string;
    icon: string;
    text: string
    textPlain: string
    type: string = 'default'
    modified: {
        $date: number
    };
    created: {
        $date: number
    };
    get title() {
        return this.headline;
    }
    set title(d: string) {
        this.headline = d;
    }
    get lastModified(): string {
        return moment(this.modified.$date).format('DD/MM/YYYY');
    }
    constructor(data?: TimelineData) {
        super({
            create: '/timelinegenerator/timelines',
            update: '/timelinegenerator/timeline/:_id',
            sync: '/timelinegenerator/timeline/:_id',
            delete: '/timelinegenerator/timeline/:_id'
        });
        this.fromJSON(data);
    }
    fromOldModel(arg: {
        _id: string,
        headline: string,
        text: string,
        icon: string
    }): Timeline {
        const { _id, text, icon, headline } = arg;
        this._id = _id;
        this.text = text;
        this.icon = icon;
        this.headline = headline;
        this.shortenedTitle = headline || '';
        if (this.shortenedTitle.length > 40) {
            this.shortenedTitle = this.shortenedTitle.substr(0, 38) + '...';
        }
        this.rights.fromBehaviours();
        return this;
    }
    async fromJSON(data: TimelineData) {
        if (data) {
            for (let i in data) {
                this[i] = data[i];
            }
            this._id = data._id;
            this.owner = data.owner as any;
            this.shortenedTitle = data.headline || '';
            if (this.shortenedTitle.length > 40) {
                this.shortenedTitle = this.shortenedTitle.substr(0, 38) + '...';
            }
            this.icon = data.icon;
        }
        this.rights.fromBehaviours();
    }
    get myRights() {
        return this.rights.myRights;
    }
    async save() {
        const json = this.toJSON();
        if (this._id) {
            await this.update(json as any);
            Folders.root.ressources.refreshFilters();
            Folder.eventer.trigger('refresh');
        }
        else {
            const { trashed, ...others } = json
            const res = await this.create(others as any);
            //refresh
            this._id = res.data._id;
            this.owner = {
                userId: model.me.userId,
                displayName: model.me.username
            }
            this.modified = {
                $date: new Date().getTime()
            }
            this.rights.fromBehaviours();
            //update root
            Folders.provideRessource(this);
            Folders.root.ressources.all.push(this);
            Folders.root.ressources.refreshFilters();
            Folder.eventer.trigger('refresh');

            Folders.onChange.next(!((await Folders.ressources()).length || (await Folders.folders()).length)); // ICI
        }
        Timeline.eventer.trigger('save');
    }
    async  remove() {
        Folders.unprovide(this);
        await http.delete('/timelinegenerator/timeline/' + this._id);
        Folders.onChange.next(!((await Folders.ressources()).length || (await Folders.folders()).length)); // ICI
    }
    async restore(){
        if(this.owner.userId==model.me.userId || this.myRights.manage){
            this.trashed = false;
            await this.save();
            const shouldUnlink = await this.isParentTrashed();
            if(shouldUnlink){
                await this.unlinkParent();
            }
        }
    }
    async unlinkParent(){
        const origins = await Folders.findFoldersContaining(this);
        const promises = origins.map(async origin => {
            origin.detachRessource(this._id);
            await origin.save();
        });
        await Promise.all(promises);
    }
    async isParentTrashed(){
        const origins = await Folders.findFoldersContaining(this);
        for(let or of origins){
            if(or.trashed){
                return true;
            }
        }
        return false;
    }
    async toTrash() {
        if(this.owner.userId==model.me.userId || this.myRights.manage){
            this.trashed = true;
            await this.save();
            Folders.trash.sync();
        }else{
            //shared ressources are moved to root
            await this.unlinkParent();
        }
    }
    async moveTo(target: Folder | string) {
        const origins = await Folders.findFoldersContaining(this);
        const promises = origins.map(async origin => {
            origin.detachRessource(this._id);
            await origin.save();
        });
        await Promise.all(promises);
        if (target instanceof Folder && target._id) {
            target.attachRessource(this._id);
            await target.save();
        }
        else {
            await Folders.root.sync();
            if (target === 'trash') {
                await this.toTrash();
            }
        }
    }
    copy(): Timeline {
        let data = JSON.parse(JSON.stringify(this));
        data.published = undefined;
        data.title = "Copie_" + data.title;
        return Mix.castAs(Timeline, data);
    }

    toJSON() {
        const { trashed } = this;
        return {
            trashed,
            _id: this._id,
            headline: this.headline,
            icon: this.icon || '',
            text: this.text || '',
            type: this.type
        };
    }
}


export class Timelines {
    filtered: Timeline[];
    sel: Selection<Timeline>;

    get all(): Timeline[] {
        return this.sel.all;
    }

    set all(list: Timeline[]) {
        this.sel.all = list;
    }

    constructor() {
        this.sel = new Selection([]);
    }

    async fill(ids: string[]): Promise<void> {
        let timelines = await Folders.ressources();
        this.all = timelines.filter(
            w => ids.indexOf(w._id) !== -1 && !w.trashed
        );
        this.refreshFilters();
    }

    async duplicateSelection(): Promise<void> {
        for (let timeline of this.sel.selected) {
            let copy = timeline.copy();
            await copy.save();
            await copy.rights.fromBehaviours();
            this.all.push(copy);
            Folders.provideRessource(copy);
        }
        this.refreshFilters();
    }

    removeSelection() {
        this.sel.selected.forEach(function (timeline) {
            timeline.remove();
        });
        this.sel.removeSelection();
        notify.info('timeline.removed');
    }

    async toTrash(): Promise<any> {
        for (let timeline of this.all) {
            await timeline.toTrash();
        }
    }

    removeTimeline(timeline: Timeline) {
        let index = this.all.indexOf(timeline);
        this.all.splice(index, 1);
    }

    refreshFilters() {
        this.filtered = this.all.filter(
            w => {
                return Filters.shared && w.owner.userId != model.me.userId
                    || Filters.mine && w.owner.userId == model.me.userId;
            }
        );
    }

    deselectAll() {
        this.sel.deselectAll();
    }
}
