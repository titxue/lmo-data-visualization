require('./style.t.scss');

import {HotTable} from '@handsontable/vue';
import {mapState} from "vuex";
import {PostMessage} from "@lib/PostMessage/index.t";
import {UPDATE_DATA} from '@/const/MessageType.t';
import 'handsontable/dist/handsontable.full.css';

const HotTableConfig = require('@/config/HotTable');

export default {
    name: 'lmo-hot-table',
    render(h) {
        return (
            h('div', {
                class: 'lmo-data_visualization_config_item'
            }, [
                h('div', {
                    class: 'data_visualization_config_item_card_title'
                }, ['编辑数据']),
                h(HotTable, {
                    ref: 'HotTable',
                    props: {
                        settings: {
                            ...HotTableConfig.settings,
                            afterChange: this.hotTableAfterChange
                        },
                        licenseKey: HotTableConfig.licenseKey
                    }
                })
            ])
        );
    },
    methods: {
        hotTableAfterChange(change, s) {
            if (s === 'edit')
                this.updateData();
        },
        updateData() {
            let csvData = '';

            this.$refs.HotTable['hotInstance'].getData().map(i => {
                if (i[0] !== null) {
                    let txt = '';

                    i.map(j => {
                        if (j !== null)
                            txt += j + ',';
                    });
                    txt = txt.slice(0, -1);
                    csvData += txt + '\r\n';
                }
            });
            PostMessage({
                type: UPDATE_DATA,
                data: csvData
            });
        },
        initHotTableData() {
            if (this.csvData !== '' && this.csvData !== undefined && this.csvData !== null) {
                const hotTableData = [];

                this.csvData.split('\r\n').map((i) => {
                    hotTableData.push(i.split(','));
                });
                this.$refs.HotTable['hotInstance'].loadData(hotTableData);
            }
        }
    },
    mounted() {
        this.initHotTableData();
        this.$nextTick(() => {
            const el = document.getElementsByClassName('ht_clone_bottom handsontable');

            if (el.length !== 0)
                el[0].remove();
        });
    },
    watch: {
        csvData() {
            this.initHotTableData();
        }
    },
    computed: {
        ...mapState({
            csvData: state => state.appStore.currentConfig.data
        })
    }
};
