// Простой клиент для ИРБИС64

module NodeIrbis {

    /**
     * Подполе с кодом и значением.
     */
    export class SubField {

        constructor(public code: string, public value: string) {
            // Nothing to do here yet
        }

        public validate(throwOnError: boolean): boolean {
            // TODO implement

            return true;
        }
    }

    /**
     * Поле записи с меткой, значением и подполями.
     */
    export class RecordField {

        /**
         * Подполя.
         */
        public subfields: SubField[];

        constructor(public tag: number, public value: string) {
            this.subfields = [];
        }

        /**
         * Добавление подполя с указанными кодом и значением.
         *
         * @param code Код подполя.
         * @param value Значение подполя.
         */
        public add(code: string, value: string) : RecordField {
            let subfield = new SubField(code, value);
            this.subfields.push(subfield);

            return this;
        }

        public validate(throwOnError: boolean): boolean {
            // TODO implement

            return true;
        }
    }

    /**
     * Запись с полями.
     */
    export class MarcRecord {

        /**
         * Имя базы данных. Для вновь созданных записей пустая строка.
         */
        public database: string = '';

        /**
         * MFN записи. Для вновь созданных записей 0.
         */
        public mfn: number = 0;

        /**
         * Статус записи.
         */
        public status: number = 0;

        /**
         * Версия записи.
         */
        public version: number = 0;

        /**
         * Массив полей.
         */
        public fields: RecordField[];

        /**
         * Добавление в конец массива поля с указанными меткой и значением.
         *
         * @param tag Метка поля.
         * @param value Значение поля до первого разделителя.
         * @return Созданное поле.
         */
        public add(tag: number, value: string = '') : RecordField {
            let field = new RecordField(tag, value);
            this.fields.push(field);

            return field;
        }

        public validate(throwOnError: boolean = true) : boolean {
            // TODO implement

            return true;
        }
    }

    /**
     * Клиентский запрос.
     */
    export class ClientQuery {

        constructor(connection: IrbisConnection, command: string) {
            this.addAnsi(command).newLine();
            this.addAnsi(connection.workstation).newLine();
            this.addAnsi(command).newLine();
            this.add(connection.clientId).newLine();
            this.add(connection.queryId).newLine();
            this.addAnsi(connection.password).newLine();
            this.addAnsi(connection.username).newLine();
            this.newLine();
            this.newLine();
            this.newLine();
        }

        /**
         * Добавляем целое число
         * (по факту выходит кодировка ANSI).
         *
         * @param value Число
         * @return this
         */
        public add(value: number) : ClientQuery {
            return this.addAnsi(value.toString());
        }

        /**
         * Добавляем текст в кодировке ANSI.
         * @param value
         * @return this
         */
        public addAnsi(value: string) : ClientQuery {
            // TODO implement
            return this;
        }

        /**
         * Добавляем текст в кодировке UTF-8.
         * @param value
         * @return this
         */
        public addUtf(value: string) : ClientQuery {
            // TODO implement
            return this;
        }

        /**
         * Добавляем перевод строки.
         * @return this
         */
        public newLine() : ClientQuery {
            // TODO implement
            return this;
        }
    }

    /**
     * Ответ сервера.
     */
    export class ServerResponse {
        public command: string = '';
        public clientId: number = 0;
        public queryId: number = 0;
        public returnCode: number = 0;
        public answerSize: number = 0;
        public serverVersion: string = '';

        constructor(socket) {
            // TODO implement
        }

        public checkReturnCode() : void {
            // TODO implement
        }

        public getLine() : string {
            // TODO implement
            return '';
        }

        public getReturnCode() : number {
            // TODO implement
            return 0;
        }

        public readAnsi() : string {
            // TODO implement
            return '';
        }

        public readInteger() : number {
            // TODO implement
            return 0;
        }

        public readRemainingAnsiLines() : string[] {
            // TODO implement
            return [];
        }

        public readRemainingAnsiText() : string {
            // TODO implement
            return '';
        }

        public readRemainingUtfLines() : string[] {
            // TODO implement
            return [];
        }

        public readRemainingUtfText() : string {
            // TODO implement
            return '';
        }

        public readUtf() : string {
            // TODO implement
            return '';
        }
    }

    /**
     * Подключение к ИРБИС-серверу.
     */
    export class IrbisConnection {
        public host: string = '127.0.0.1';
        public port: number = 6666;
        public username: string = '';
        public password: string = '';
        public database: string = 'IBIS';
        public workstation: string = 'C';
        public clientId: number = 0;
        public queryId: number = 0;
        public serverVersion: string = '';
        public iniFile = null;
        public interval: number = 0;

        private connected: boolean = false;

        /**
         * Актуализация записи с указанным MFN.
         *
         * @param database Имя базы данных.
         * @param mfn MFN, подлежащий актуализации.
         * @return boolean Признак успешности операции.
         */
        public actualizeRecord(database: string, mfn: number) : boolean {
            if (!this.connected) {
                return false;
            }

            let query = new ClientQuery(this, 'F');
            query.addAnsi(database).newLine();
            query.add(mfn).newLine();
            let response = this.execute(query);
            response.checkReturnCode();

            return true;
        }

        /**
         * Подключение к серверу ИРБИС64.
         * @return boolean Признак успешности операции.
         */
        public connect() : boolean {
            if (this.connected) {
                return true;
            }

            AGAIN: while (true) {
                this.clientId = 100000 + Math.floor(Math.random() * 900000);
                this.queryId = 1;

                let query = new ClientQuery(this, 'A');
                query.addAnsi(this.username).newLine();
                query.addAnsi(this.password);

                let response = this.execute(query);
                response.getReturnCode();
                if (response.returnCode == -3337) {
                    continue AGAIN;
                }

                if (response.returnCode < 0) {
                    return false;
                }

                this.connected = true;
                this.serverVersion = response.serverVersion;
                this.interval = parseInt(response.readUtf());
                this.iniFile = null; // TODO implement

                return true;
            }
        }

        /**
         * Создание базы данных.
         *
         * @param database Имя создаваемой базы.
         * @param description Описание в свободной форме.
         * @param readerAccess Читатель будет иметь доступ?
         * @return boolean Признак успешности операции.
         */
        public createDatabase(database: string, description: string, readerAccess: number = 1) : boolean {
            if (!this.connected) {
                return false;
            }

            let query = new ClientQuery(this, 'T');
            query.addAnsi(database).newLine();
            query.addAnsi(description).newLine();
            query.add(readerAccess).newLine();

            let response = this.execute(query);
            response.checkReturnCode();

            return true;
        }

        /**
         * Создание словаря в указанной базе данных.
         *
         * @param database Имя базы данных.
         * @return boolean Признак успешности операции.
         */
        public createDictionary(database: string) : boolean {
            if (!this.connected) {
                return false;
            }

            let query = new ClientQuery(this, 'Z');
            query.addAnsi(database).newLine();
            let response = this.execute(query);
            response.checkReturnCode();

            return true;
        }

        /**
         * Удаление указанной базы данных.
         *
         * @param database Имя удаляемой базы данных.
         * @return boolean Признак успешности операции.
         */
        public deleteDatabase(database: string) : boolean {
            if (!this.connected) {
                return false;
            }

            let query = new ClientQuery(this, 'W');
            query.addAnsi(database).newLine();
            let response = this.execute(query);
            response.checkReturnCode();

            return true;
        }

        /**
         * Удаление записи по её MFN.
         *
         * @param mfn MFN удаляемой записи.
         * @return boolean Признак успешности операции.
         */
        public deleteRecord(mfn: number) : boolean {
            // TODO implement
            return false;
        }

        /**
         *  Отключение от сервера.
         *
         *  @return boolean Признак успешности операции
         *  (по факту всегда true).
         */
        public disconnect() : boolean {
            if (!this.connected) {
                return true;
            }

            let query = new ClientQuery(this, 'B');
            query.addAnsi(this.username);
            this.execute(query);
            this.connected = false;

            return true;
        }

        /**
         * Получение максимального MFN для указанной базы данных.
         *
         * @param database Имя базы данных.
         * @return number Максимальный MFN или 0.
         */
        public getMaxMfn(database: string) {
            if (!this.connected) {
                return 0;
            }

            let query = new ClientQuery(this, 'O');
            query.addAnsi(database);
            let response = this.execute(query);
            response.checkReturnCode();

            return response.returnCode;
        }

        /**
         * Отправка клиентского запроса на сервер
         * и получение от него.
         *
         * @param query Клиентский запрос.
         * @return ServerResponse Ответ сервера.
         */
        public execute(query: ClientQuery) : ServerResponse {
            // TODO implement
            this.queryId++;
            return new ServerResponse(123);
        }

        /**
         * Получение статуса, подключен ли клиент в настоящее время.
         *
         * @return boolean Подключен?
         */
        public isConnected() : boolean {
            return this.connected;
        }
    }

}