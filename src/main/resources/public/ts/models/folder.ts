import http from 'axios';
import { Rights, Shareable, model, idiom } from 'entcore';
import { Mix, Provider, Selection, Selectable, Eventer } from 'entcore-toolkit';
import { _ } from 'entcore';
import { Timeline, Timelines } from './timeline';

//=== Utils
function uniq<T> (arrArg : T[]) {
    return arrArg.filter((elem, pos, arr) => {
        return arr.indexOf(elem) == pos;
    });
}
//
export class BaseFolder implements Selectable {
    private _ressources: Timelines;
    selected: boolean;
    name: string;
    static eventer: Eventer = new Eventer();

    constructor() { }
    get ressources() {
        if (this._ressources == null) {
            this._ressources = new Timelines;
        }
        return this._ressources;
    }
    findRessource(id: string): Timeline | undefined {
        return this._ressources && this._ressources.all.find(r => r._id == id);
    }
}

class HierarchicalFolder extends BaseFolder {
    children: Selection<Folder>;
    _id: string;
    _selection: (Timeline | Folder)[];
    ressourceIds: string[];

    constructor() {
        super();
        this.children = new Selection([]);
        this.ressourceIds = [];
    }
    
    deselectAll() {
        this.children.deselectAll();
        this.ressources.deselectAll();
    }

    get displayName(): string {
        if (this.name === "root") {
            return idiom.translate("projects.root");
        }
        return this.name;
    }

    get shortenedName(): string {
        let shortenedName = this.name;
        if (shortenedName === "root") {
            shortenedName = idiom.translate("projects.root");
        }
        if (shortenedName.length > 38) {
            shortenedName = shortenedName.substr(0, 35) + '...';
        }
        return shortenedName;
    }

    async moveSelectionTo(folder: Folder) {
        for (let item of this.selection) {
            await item.moveTo(folder);
        }
        if (folder instanceof Folder) {
            folder.save();
        }
        if (this instanceof Folder) {
            this.save();
        }
    }

    contains(folder: Folder): boolean {
        if (!folder) {
            return false;
        }
        if (folder._id === this._id) {
            return true;
        }
        let result = false;
        for (let i = 0; i < this.children.all.length; i++) {
            result = this.children.all[i]._id === folder._id || this.children.all[i].contains(folder);
            if (result) {
                return true;
            }
        }

        return result;
    }

    get selectedLength(): number {
        return this.ressources.sel.selected.length + this.children.selected.length;
    }

    async sync(): Promise<void> {
        await this.ressources.fill(this.ressourceIds);
        let folders = await Folders.folders();
        this.children.all = folders.filter(
            f => (f.parentId === this._id || f.parentId === this.name) && !f.trashed
        );
        this.children.all.forEach((c) => {
            c.children.all = folders.filter(f => f.parentId === c._id && !f.trashed);
        });
        BaseFolder.eventer.trigger('refresh');
    }

    get selection(): (Timeline | Folder)[] {
        let newSel = this.ressources.sel.selected.concat(this.children.selected as any);
        if (!this._selection || newSel.length !== this._selection.length) {
            this._selection = newSel;
        }
        return this._selection;
    }

    get selectionIsRessources(): boolean {
        return _.find(this.selection, (e) => !(e instanceof Timeline)) === undefined;
    }

    get selectionIsFolders(): boolean {
        return _.find(this.selection, (e) => !(e instanceof Folder)) === undefined;
    }

    async trashSelection(): Promise<any> {
        for (let item of this.selection) {
            await item.toTrash();
        }
        await Folders.trash.sync();
        this.children.deselectAll();
        this.ressources.deselectAll();
        await this.sync();
    }

    async removeSelection(): Promise<any> {
        for (let item of this.selection) {
            await item.remove();
        }
        await Folders.root.sync();
        this.children.deselectAll();
        this.ressources.deselectAll();
        await this.sync();
    }

    findRessource(id: string): Timeline | undefined {
        const founded = super.findRessource(id);
        if (founded) {
            return founded;
        }
        for (let c of this.children.all) {
            const founded = c.findRessource(id);
            if (founded) {
                return founded;
            }
        }
        return undefined;
    }

    hasAttachedRessource(id: string): boolean {
        return this.ressourceIds.filter(r => r == id).length > 0;
    }

    attachRessource(id: string) {
        //add uniq
        this.detachRessource(id);
        this.ressourceIds.push(id);
    }

    detachRessource(id: string) {
        this.ressourceIds = this.ressourceIds.filter(r => r != id);
    }

    async restoreSelection(): Promise<void> {
        //get folders and resources recursively
        const uniqFolders: Folder[] = uniq(this.selection.filter(f=> f instanceof Folder)//only folders
                                    .map(f => f as Folder)//cast to folder
                                    );//return array
        const uniqResources : Timeline[] = uniq(this.selection.filter(f=> f instanceof Timeline) as Timeline[]);
        // restore folders FIRST (resource are unlink if parent still trashed)
        for (let item of uniqFolders) {
            await item.restore();
        }
        // restore resources
        for (let item of uniqResources) {
            await item.restore();
            
        }
        await this.sync();
    }
}

export class Folder extends HierarchicalFolder implements Shareable {
    parentId: string;
    rights: Rights<Folder>;
    shared: any;
    owner: { userId: string, displayName: string };
    trashed: boolean;

    constructor() {
        super();
        this.rights = new Rights(this);
        this.rights.fromBehaviours();
    }

    get myRights() {
        return this.rights.myRights;
    }

    async create(): Promise<void> {
        let response = await http.post('/timelinegenerator/folder', this);
        Mix.extend(this, response.data);
        this.owner = { userId: model.me.userId, displayName: model.me.firstName + ' ' + model.me.lastName };
        Folders.provideFolder(this);
    }

    async saveChanges(): Promise<void> {
        await http.put('/timelinegenerator/folder/' + this._id, this);
    }

    async save(): Promise<void> {
        if (!this._id) {
            await this.create();
        }
        else {
            await this.saveChanges();
        }
    }

    toJSON() {
        return {
            parentId: this.parentId,
            name: this.name,
            trashed: this.trashed,
            ressourceIds: this.ressourceIds
        }
    }
    async restore(){
        this.trashed = false;
        await this.save();
        const ressources = await Folders.ressources();
        const folders = await Folders.folders();
        const parent = folders.find(f=>f._id==this.parentId);
        const shouldUnlink = parent && parent.trashed;
        if(shouldUnlink){
            await this.moveTo("root")
        }
        //restore children
        const children = folders.filter(f=>f.parentId==this._id);
        for(let child of children){
            await child.restore();
        }
        //restore attached ressources
        const cRes = ressources.filter(res=>this.ressourceIds.indexOf(res._id)>-1); 
        for(let res of cRes){
            await res.restore();
        }
    }
    async toTrash(): Promise<void> {
        this.trashed = true;
        //be sure tu sync ressources and children before trash recursive
        await this.sync();
        await this.ressources.toTrash();
        await this.saveChanges();
        for(let child of this.children.all){
            await child.toTrash();
        }
        //sync after trash
        await Folders.trash.sync();
        await this.sync();
    }

    async moveTo(target: string | Folder): Promise<void> {
        if (target instanceof Folder && target._id) {
            this.parentId = target._id;
            target.sync();
        }
        else {
            if ((target instanceof Folder && target.name === 'root') || (target === 'root')) {
                this.parentId = 'root';
                Folders.root.sync();
            }
            if (target === 'trash') {
                await this.toTrash();
            }
        }

        await this.saveChanges();
    }

    async remove(): Promise<void> {
        await http.delete('/timelinegenerator/folder/' + this._id);
        await this.sync();
    }
}

export class Root extends HierarchicalFolder {
    constructor() {
        super();
        this.name = 'root';
    }

    async sync(): Promise<void> {
        let ressources = await Folders.ressources();
        let folders = await Folders.folders();
        this.ressources.all = [];
        ressources.forEach((w) => {
            let inRoot = !w.trashed;
            folders.forEach((f) => {
                inRoot = inRoot && f.ressourceIds.indexOf(w._id) === -1;
            });
            if (inRoot) {
                this.ressources.all.push(w);
            }
        });

        this.ressources.refreshFilters();

        this.children.all = folders.filter(
            f => (f.parentId === this.name || !f.parentId) && !f.trashed
        );
        //sort before affect
        this.children.all.sort((a, b) => {
            const nameA = a.name || "";
            const nameB = b.name || "";
            return nameA.localeCompare(nameB);
        })
        //
        this.children.all.forEach((c) => {
            c.children.all = folders.filter(f => f.parentId === c._id && !f.trashed);
        });
        BaseFolder.eventer.trigger('refresh');
    }
}

export class Trash extends HierarchicalFolder {
    name: string;
    filtered: (Timeline | Folder)[];

    constructor() {
        super();
        this.name = 'trash';
        this._id = 'trash';
        //wait class loaded
        setTimeout(() => this.sync())
    }

    async sync(): Promise<void> {
        let ressources = await Folders.ressources();
        this.ressources.all = ressources.filter(
            w => w.trashed && w.myRights.manager
        );
        this.ressources.refreshFilters();
        let folders = await Folders.folders();
        this.children.all = folders.filter(
            f => f.trashed
        );
        BaseFolder.eventer.trigger('refresh');
    }

    async removeSelection(): Promise<any> {
        for (let item of this.selection) {
            await item.remove();
            Folders.unprovide(item);
        }

        this.ressources.deselectAll();
        this.children.deselectAll();
        await Folders.trash.sync();
    }
}

export class Folders {
    private static _ressourceProvider: Provider<Timeline>;
    private static _folderProvider: Provider<Folder>;
    static get ressourceProvider() {
        if (Folders._ressourceProvider == null) {
            Folders._ressourceProvider = new Provider<Timeline>('/timelinegenerator/timelines', Timeline);
        }
        return Folders._ressourceProvider;
    }
    static get folderProvider() {
        if (Folders._folderProvider == null) {
            Folders._folderProvider = new Provider<Folder>('/timelinegenerator/folder/list/all', Folder);
        }
        return Folders._folderProvider;
    }
    static async ressources(): Promise<Timeline[]> {
        let ressources: Timeline[];
        //wait for behaviours before loading timelines
        await new Timeline().rights.fromBehaviours();
        if (model.me) {
            ressources = await this.ressourceProvider.data();
        }
        else {
            //TODO
            //ressources = await this.publicRessourceProvider.data();
            ressources = await this.ressourceProvider.data();
        }

        return ressources;
    }

    static async folders(): Promise<Folder[]> {
        let folders: Folder[] = await this.folderProvider.data();
        return folders;
    }

    static provideRessource(ressource: Timeline) {
        this.ressourceProvider.push(ressource);
    }

    static provideFolder(folder: Folder) {
        this.folderProvider.push(folder);
    }

    static unprovide(item: Folder | Timeline) {
        if (item instanceof Folder) {
            this.folderProvider.remove(item);
        }
        else {
            this.ressourceProvider.remove(item);
        }
    }

    static async findFoldersContaining(ressource: Timeline): Promise<Folder[]> {
        let folders = await this.folders();
        const founded = folders.filter((f) => {
            return f.hasAttachedRessource(ressource._id);
        });
        return founded;
    }

    static root: Root = new Root();
    static trash: Trash = new Trash();
}

export class Filters {
    private static _mine: boolean;
    private static _shared: boolean;
    public static reset() {
        Filters._mine = true;
        Filters._shared = true;
    }
    static get mine(): boolean { return Filters._mine; }
    static set mine(a) {
        //Filters.reset();
        Filters._mine = a;
    }
    static get shared(): boolean { return Filters._shared; }
    static set shared(a) {
        //Filters.reset();
        Filters._shared = a;
    }
}
Filters.reset();
