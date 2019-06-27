import { ng, template, idiom, notify } from 'entcore';
import { Folders, Folder, Filters, BaseFolder, Root, Trash } from '../models/folder';
import { Timeline } from '../models/timeline';
import { _ } from 'entcore';
import { TimelineModel } from './commons';

export interface LibraryControllerScope {
    root: Root
    timeline: TimelineModel
    folder: Folder
    currentFolder: Folder | Root
    filters: typeof Filters
    displayLib: {
        data: any
        showShare: boolean
        targetFolder: Folder
        searchTimelines: string
        lightbox: {
            manageTimelines: boolean,
            properties: boolean
        }
    }
    hasSelectedElements(): boolean
    hasSelectedTimelines(): boolean
    hasSelectedFolders(): boolean
    hasOneElement(): boolean
    hasOneFolder(): boolean
    hasOneTimeline(): boolean
    restore(): void;
    move(): void;
    open(timeline: Timeline): void;
    openRoot(): void;
    openTrash(): void;
    lightbox(name: string, data?: any): void;
    closeLightbox(name: string, data?: any): void;
    can(right: string): boolean
    searchTimeline(timeline: Timeline): void;
    searchFolder(folder: Folder): void;
    createFolder(): void;
    trashSelection(): void;
    removeSelection(): void;
    duplicateTimelines(): void;
    createTimelineView(): void;
    viewTimeline(timeline: Timeline): void;
    openFolder(folder: Folder): void;
    selectionContains(folder: Folder): boolean;
    dropTo(targetItem: string | Folder, $originalEvent): void;
    removeTimeline(): void;
    isTrashFolder(): boolean;
    //
    $apply: any
}
export function LibraryDelegate($scope: LibraryControllerScope, $rootScope, $location) {
    $scope.displayLib = {
        data: undefined,
        showShare: false,
        lightbox: {
            manageTimelines: false,
            properties: false
        },
        searchTimelines: "",
        targetFolder: undefined
    }
    template.open('library/folder-content', 'library/folder-content');
    $scope.currentFolder = Folders.root;
    $scope.currentFolder.sync();
    $scope.root = Folders.root;
    $scope.folder = new Folder();
    $scope.filters = Filters;
    $scope.filters.mine = true;

    template.open('library/create-timeline', 'library/create-timeline');
    template.open('library/toaster', 'library/toaster');
    template.open('library/publish', 'library/publish');
    template.open('library/properties', 'library/properties');
    template.open('library/move', 'library/move');

    BaseFolder.eventer.on('refresh', () => $scope.$apply());
    Timeline.eventer.on('save', () => $scope.$apply());

    $rootScope.$on('share-updated', async (event, changes) => {
        for (let timeline of $scope.currentFolder.selection) {
            await (timeline as Timeline).sync();
        }

        $scope.$apply();
    });
    //=== Private methods
    const resetSelection=()=>{
        $scope.currentFolder.deselectAll();
    }
    //=== Public methods
    $scope.hasOneElement = () => $scope.currentFolder.selection.length == 1;
    $scope.hasOneTimeline = () => $scope.hasOneElement() && $scope.currentFolder.selectionIsRessources;
    $scope.hasOneFolder = () => $scope.hasOneElement() && $scope.currentFolder.selectionIsFolders;

    $scope.isTrashFolder = () => {
        return $scope.currentFolder._id == "trash";
    }
    $scope.hasSelectedElements = () => {
        return $scope.currentFolder.selectedLength > 0;
    }
    $scope.hasSelectedTimelines = () => {
        return $scope.currentFolder.selection.filter(e => e instanceof Timeline).length > 0;
    }
    $scope.hasSelectedFolders = () => {
        return $scope.currentFolder.selection.filter(e => e instanceof Folder).length > 0;
    }

    $scope.searchTimeline = (item: Timeline) => {
        return !$scope.displayLib.searchTimelines || idiom.removeAccents(item.title.toLowerCase()).indexOf(
            idiom.removeAccents($scope.displayLib.searchTimelines).toLowerCase()
        ) !== -1;
    };

    $scope.searchFolder = (item: Folder) => {
        return !$scope.displayLib.searchTimelines || idiom.removeAccents(item.name.toLowerCase()).indexOf(
            idiom.removeAccents($scope.displayLib.searchTimelines).toLowerCase()
        ) !== -1;
    };

    $scope.can = (right: string) => {
        let folder: Folder | Root = $scope.currentFolder;
        return folder.ressources.sel.selected.find((w: Timeline) => !w.myRights[right]) === undefined;
    };

    $scope.removeTimeline = async function () {
        const timeline = Folders.root.findRessource($scope.timeline._id);
        if (timeline) {
            await timeline.remove();
        }
        $location.path('/list-timelines');
    }

    $scope.openFolder = (folder) => {
        resetSelection();
        template.open('library/folder-content', 'library/folder-content');
        $scope.currentFolder = folder;
        $scope.currentFolder.sync();
    };

    $scope.createFolder = async () => {
        $scope.folder.parentId = $scope.currentFolder._id;
        $scope.displayLib.lightbox['newFolder'] = false;
        $scope.currentFolder.children.push($scope.folder);
        await $scope.folder.save();
        $scope.folder = new Folder();
    };

    $scope.trashSelection = async () => {
        $scope.closeLightbox('confirmRemove');
        await $scope.currentFolder.trashSelection();
        $scope.$apply();
        notify.info('timeline.selection.trashed');
    }

    $scope.removeSelection = async () => {
        $scope.closeLightbox('confirmRemove');
        await $scope.currentFolder.removeSelection();
        $scope.$apply();
        notify.info('timeline.selection.removed');
    }

    $scope.openTrash = () => {
        resetSelection();
        template.open('library/folder-content', 'library/trash');
        $scope.currentFolder = Folders.trash;
        Folders.trash.sync();
    };

    $scope.openRoot = async () => {
        resetSelection();
        template.open('library/folder-content', 'library/folder-content');
        $scope.currentFolder = Folders.root;
        await Folders.root.sync();
        $scope.$apply()
    };

    $scope.viewTimeline = (timeline: Timeline) => {
        resetSelection();
        $location.path('/view/' + timeline._id);
    };

    $scope.open = (item: Timeline | Folder) => {
        resetSelection();
        if (item instanceof Timeline) {
            $scope.viewTimeline(item);
        }
        else {
            $scope.openFolder(item);
        }
    };

    $scope.dropTo = async (targetItem: string | Folder, $originalEvent) => {
        let dataField = $originalEvent.dataTransfer.types.indexOf && $originalEvent.dataTransfer.types.indexOf("application/json") > -1 ? "application/json" : //Chrome & Safari
            $originalEvent.dataTransfer.types.contains && $originalEvent.dataTransfer.types.contains("Text") ? "Text" : //IE
                undefined;
        let originalItem: string = JSON.parse($originalEvent.dataTransfer.getData(dataField));

        if (targetItem instanceof Folder && originalItem === targetItem._id) {
            return;
        }
        let timelines = await Folders.ressources();
        let actualItem: Timeline | Folder = timelines.find(w => w._id === originalItem);
        if (!actualItem) {
            let folders = await Folders.folders();
            actualItem = folders.find(f => f._id === originalItem);
        }
        await actualItem.moveTo(targetItem);
        await $scope.currentFolder.sync();
        $scope.$apply();
        if (targetItem instanceof Folder) {
            targetItem.save();
        }
    };

    $scope.selectionContains = (folder: Folder) => {
        let contains = false;
        let selection: (Timeline | Folder)[] = $scope.currentFolder.selection;
        selection.forEach((item) => {
            if (item instanceof Folder) {
                contains = contains || item.contains(folder) || item._id === folder._id;
            }
        });

        return contains;
    }

    $scope.move = async () => {
        $scope.lightbox('move')
        let folder = $scope.currentFolder as Folder;
        await folder.moveSelectionTo($scope.displayLib.targetFolder);
        await Folders.root.sync();
        await $scope.currentFolder.sync();
        await $scope.displayLib.targetFolder.sync();
        $scope.$apply();
    };

    $scope.duplicateTimelines = async () => {
        let folder = $scope.currentFolder as Folder;
        await folder.ressources.duplicateSelection();
        $scope.$apply();
    };

    $scope.restore = async () => {
        await $scope.currentFolder.restoreSelection();
        $scope.$apply();
    };

    $scope.lightbox = function (lightboxName: string, data: any) {
        $scope.displayLib.data = data;
        $scope.displayLib.lightbox[lightboxName] = !$scope.displayLib.lightbox[lightboxName];
    };

    $scope.closeLightbox = function (lightboxName: string, data: any) {
        $scope.displayLib.data = data;
        $scope.displayLib.lightbox[lightboxName] = false;
    };
}