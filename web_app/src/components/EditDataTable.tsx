import 'handsontable/dist/handsontable.full.min.css';
import {HotTable} from '@handsontable/react';
import React, {useImperativeHandle, useRef, useState} from "react";
import Drawer from "@hi-ui/drawer";
import {Button} from "@hi-ui/hiui";
import utils from "../utils";
import Hooks from "../bin/Hooks";
import {CellChange, ChangeSource} from "handsontable/common";
import PostMessage from "../lib/PostMessage";
import {registerAllModules} from 'handsontable/registry';
import {ReactState} from "../types/ReactTypes";
import useTemplateMessageListener = Hooks.useTemplateMessageListener;

registerAllModules();

export interface IEditDataTable {
    open: () => void;
}

const EditDataTable: React.ForwardRefExoticComponent<React.RefAttributes<IEditDataTable>> = React.forwardRef((_props: {}, ref: React.ForwardedRef<IEditDataTable>) => {
    const [visible, setVisible]: ReactState<boolean> = useState<boolean>(false);
    const [data, setData] = useState<Array<Array<string | number>>>([[]]);
    const hotTableRef = useRef(null);

    useImperativeHandle(ref, (): IEditDataTable => ({
        open
    }));

    useTemplateMessageListener('TEMPLATE_DATA', (e: Array<Array<string | number>>): void => {
        setData(e);
    });

    const open = (): void => {
        setVisible(!visible);
    };

    const selectLocalFile = (): void => {
        utils.selectFiles(false).then((file): void => {
            if (file.length === 1) {
                const fr: FileReader = new FileReader();

                fr.readAsText(file[0] as any);
                fr.onload = (res: ProgressEvent<FileReader>): void => {
                    try {
                        const _data = JSON.parse(res?.target?.result as string);

                        setData(_data);
                        sendData(_data);
                    } catch (e) {
                        console.log(e);
                    }
                };
            }

        });
    };
    const sendData = (data: Array<Array<string | number>>): void => PostMessage.send({type: 'SET_DATA', message: data});
    // const exportDefaultData = (): void => {
    // };

    return (
        <Drawer
            title={'编辑数据'}
            width={1000}
            closeOnEsc
            preload
            visible={visible}
            onClose={(): void => {
                open();
            }}
        >
            <div>
                <div style={
                    {
                        marginBottom: '1rem'
                    }
                }>
                    <Button type={'primary'} onClick={selectLocalFile}>加载本地数据</Button>
                    {/*<Button onClick={exportDefaultData}>导出默认数据</Button>*/}
                </div>
                <div>
                    <HotTable
                        minRows={50}
                        minCols={50}
                        data={data}
                        ref={hotTableRef}
                        width="auto"
                        height="auto"
                        rowHeaders={true}
                        colHeaders={true}
                        colWidths={50}
                        rowHeights={20}
                        afterChange={(changes: CellChange[] | null, source: ChangeSource): void => {
                            if (source === 'edit') {
                                const hotInstance: any = hotTableRef.current;
                                const _data = hotInstance.__hotInstance.getData();
                                const nd = _data.map((subArr: any) => subArr.filter((item: any): boolean => item !== null)).filter((i: Array<string | number | null>): boolean => i.length !== 0);

                                sendData(nd);
                            }
                        }}
                        licenseKey="non-commercial-and-evaluation"
                        contextMenu={{
                            items: {
                                'row_above': {name: '在上方插入行'},
                                'row_below': {name: '在下方插入行'},
                                'col_left': {name: '在左侧插入行'},
                                'col_right': {name: '在右侧插入行'},
                                '----------': {name: '---------'},
                                'remove_row': {name: '删除整行'},
                                'remove_col': {name: '删除整列'},
                                '---------': {name: '---------'},
                                'copy': {name: '复制 (C)'},
                                'cut': {name: '剪切 (X)'},
                                'paste': {name: '粘贴 (V)'},
                                '-----------': {name: '---------'},
                                'undo': {name: '撤销 (Z)'}
                            }
                        }}
                    />
                </div>
            </div>
        </Drawer>
    );
});

EditDataTable.displayName = 'EditDataTable';

export default EditDataTable;