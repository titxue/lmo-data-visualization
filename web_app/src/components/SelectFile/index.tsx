import {Button, Form, FormHelpers, FormItemProps, Grid, Input, Modal, Pagination, Search, Upload} from "@hi-ui/hiui";
import React, {useImperativeHandle, useRef, useState} from "react";
import ImageList, {IImageItem} from "./ImageList";
import Request from "../../lib/Request";
import {ReactState} from "../../types/ReactTypes";

export interface ISelectFileProps {
    onSelect?: (data: IImageItem) => void;
}

export interface ISelectFileRef {
    open: () => void;
}

interface IQuery {
    name: string;
    pageIndex: number;
    pageSize: number;
}

interface IUploadFrom {
    name: string;
    media: File
}

const SelectFile = React.forwardRef((props: ISelectFileProps, ref: React.ForwardedRef<ISelectFileRef>) => {
    const {onSelect} = props;
    const [query, setQuery]: ReactState<IQuery> = useState({
        name: '',
        pageIndex: 0,
        pageSize: 10
    });
    const [isUpload, setIsUpLoad]: ReactState<boolean> = useState<boolean>(false);
    const FormItem: React.FC<FormItemProps> = Form.Item;
    const uploadFromRef: React.RefObject<FormHelpers<IUploadFrom>> = useRef<FormHelpers>(null);
    const [pageTotal, setPageTotal]: ReactState<number> = useState<number>(0);
    const [visible, setVisible]: ReactState<boolean> = useState<boolean>(false);

    const open = (): void => setVisible(!visible);

    useImperativeHandle(ref, () => ({
        open
    }));

    return (
        <Modal
            footer={null}
            visible={visible}
            title={'素材库'}
            width={'50%'}
            height={'60%'}
            onClose={(): void => open()}
            onCancel={(): void => open()}
        >
            <div className={'c-select-file'}>
                <div className={'c-select-file-search'}>
                    <Grid.Row gutter={true} justify={"space-between"}>
                        <Grid.Col span={{lg: 12, xl: 12, md: 16, sm: 16, xs: 16}}>
                            <Search
                                placeholder={'输入名称搜索...'}
                                onSearch={(data: string): void => {
                                    setQuery({
                                        ...query,
                                        name: data
                                    });
                                }}
                            />
                        </Grid.Col>
                        <Grid.Col span={8}>
                            <Button
                                type={'primary'}
                                onClick={(): void => {
                                    setIsUpLoad(!isUpload);
                                }}
                            >上传</Button>
                        </Grid.Col>
                    </Grid.Row>
                </div>
                <div className={'c-select-file-content animated fadeIn'}>
                    <ImageList onSelect={
                        (data): void => {
                            onSelect && onSelect(data);
                        }
                    } query={{...query}} onRequest={({total}): void => {
                        setPageTotal(total);
                    }}/>
                </div>
                <div className={'c-select-file-pagination'}>
                    <Pagination
                        pageSize={query.pageSize}
                        total={pageTotal}
                        showTotal
                        onChange={(...args) => {
                            setQuery({
                                ...query,
                                pageIndex: args[0]
                            });
                        }}
                    />
                </div>
            </div>
            <Modal
                onClose={(): void => {
                    setIsUpLoad(!isUpload);
                }}
                onCancel={(): void => {
                    setIsUpLoad(!isUpload);
                }}
                onConfirm={(): void => {
                    Request.uploadFile(uploadFromRef.current?.getFieldsValue())
                        .then((): void => setIsUpLoad(!isUpload));
                }}
                visible={isUpload}
                title={'上传素材'}
                unmountOnClose
            >
                <div className={'animated fadeIn'}>
                    <Form innerRef={uploadFromRef} labelPlacement="top" initialValues={{name: '', media: null}}>
                        <FormItem label="自定义名称" field="name" valueType="string">
                            <Input placeholder="请输入"/>
                        </FormItem>
                        <FormItem required={true} label="文件" field="media" valueType="integer">
                            <Upload
                                type="drag"
                                data={[]}
                                accept=".png,.jpg,.jpeg,.svg"
                                customUpload={(file: FileList | null): void => {
                                    if (file) {
                                        uploadFromRef.current?.setFieldValue('name', file[0].name.split('.')[0]);
                                        uploadFromRef.current?.setFieldValue('media', file[0]);
                                    }
                                }}
                            />
                        </FormItem>
                    </Form>
                </div>
            </Modal>
        </Modal>
    );
});

SelectFile.displayName = 'SelectFile';

export default SelectFile;