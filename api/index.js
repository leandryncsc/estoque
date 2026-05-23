let app;
try {
	// Tentar carregar o servidor compilado
	// Se isso falhar na invocação da função, capturamos o erro e retornamos um JSON claro
	app = require('../server/dist/index').default;
} catch (err) {
	console.error('Failed to load server dist/index.js:', err && (err.stack || err));

	// Criar um handler compatível com Vercel que responde com JSON em vez de crashar
	app = (req, res) => {
		const message = (err && (err.message || String(err))) || 'unknown error';
		const stack = err && err.stack ? err.stack.toString() : undefined;
		res.statusCode = 500;
		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify({
			status: 'error',
			code: 'SERVER_LOAD_FAILED',
			message,
			stack: process.env.NODE_ENV === 'development' ? stack : undefined
		}));
	};
}

module.exports = app;