/**
 * Data-Visualization Server
 * @author ayuanlmo
 * Server Core
 * **/

(() => {
    const _Express = require('express');
    const _Router = require('./const/routers');
    const _Func = require('./funcs');
    const _Conf = require('./conf/ServerConfig');
    const _Cmd = require('./const/cmd');
    const _Net = require('./lib/net');
    const _Path = require('path');
    const _App = _Express();
    const _WsApp = require('express-ws')(_App);
    const _Pool = _WsApp['getWss'](_Router.__SOCKET_CONNECT);

    let onlineUsers = 0;

    global.dbConf = {
        _path: _Path['resolve'](__dirname + '/lib/sqlite/db/db.ting.db'),
        _template: _Path['resolve'](__dirname + '/static/DataVisualizationTemplate'),
        index: require('./const/templateIndex')
    };
    new (require('./lib/sqlite/index').T_DB);
    _App['use'](_Express['urlencoded']({extended: false}));
    _App['use'](_Conf['__STATIC_PATH'], _Express['static'](`${__dirname}${_Conf.__STATIC_PATH}`));
    _App['use'](_Conf['__STATIC_PATH'], _Express['static'](`../dist`));
    _App['ws'](_Router['__SOCKET_CONNECT'], async (_) => {
        onlineUsers += 1;
        _['on']('message', __ => {
            if (__ === _Conf['__SOCKET_PONG_KEY'])
                return _['send'](_Conf['__SOCKET_PONG_MESSAGE']);
            const _m = JSON.parse(require('./utils/index').binaryToString(__));

            if (_m['cmd'] === _Cmd['__SYNTHESIS'])
                new (require('./timecut/index')).TC(_Pool, _m['data']);
        });
        _['on']('close', () => {
            onlineUsers -= 1;
        });
        await _['send'](
            require('./utils/index').stringToBinary(require('./funcs')._Stringify({
                type: 'connect',
                data: {
                    onlineUsers: onlineUsers,
                    tenantID: `ting-${require('./funcs')['_Get_UUID']()}`,
                    timestamp: new Date().getTime()
                }
            }))
        );
    });
    _App['post'](_Router.__GET_TEMPLATE, (_, __) => {
        return _Func['_GetTemplateList'](__);
    });
    _App['post'](_Router.__GET_MEDIA, (_, __) => {
        _Func['_GetMedia'](__);
    });
    _App['get']('*', (_, __) => {
        __['json']({data: {}, code: 404, message: 'No Found'});
    });
    _App['post']('*', (_, __) => {
        __['json']({data: {}, code: 404, message: 'No Found'});
    });
    _Net['__START_SERVER'](_App);
})();
