import test from 'ava'
import { join } from 'path'
import { readdirSync } from 'fs'
import { HttpRequest, Context } from '@azure/functions'
import { stub } from 'sinon'
import * as recover from './recover'
import { sign as fakeSignature } from 'jsonwebtoken'
import sign from './index'

const TEST_MESSAGE = 'TEST_MESSAGE'
const TEST_SECRET = 'TEST_SECRET'

const createContext = (): Context =>
	(({
		res: {},
	} as unknown) as Context)
const createReq = (
	id?: string,
	message?: string,
	secret?: string,
	signature?: string
): HttpRequest =>
	(({
		params: {
			id,
		},
		body: {
			message,
			secret,
			signature,
		},
	} as unknown) as HttpRequest)
const fakeRecover = (message: string, signature: string): string =>
	`${message}-${signature}`
stub(recover, 'recover').callsFake(fakeRecover)

test.todo('Returns the account that sign')

test.todo('Returns a new public signature')

test('All sign methods succeed', (t) =>
	Promise.all(
		readdirSync(join(__dirname, '../functions/sign'), {
			withFileTypes: true,
		})
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name)
			.map((id) =>
				(async () => {
					t.log(`signing method: ${id}`)
					const context = createContext()
					const signature = fakeSignature(Math.random().toString(), id)
					await sign(
						context,
						createReq(id, TEST_MESSAGE, TEST_SECRET, signature)
					)
					return {
						id,
						context,
						signature,
						message: TEST_MESSAGE,
						secret: TEST_SECRET,
					}
				})()
			)
	).then((results) => {
		results.map((result) => {
			t.log(result)
			t.log(result.context)
			t.is(result.context.res?.status, 200)
			t.is(
				result.context.res?.body.account,
				fakeRecover(result.message, result.signature)
			)
			t.true(typeof result.context.res?.body.publicSignature === 'string')
		})
	}))
