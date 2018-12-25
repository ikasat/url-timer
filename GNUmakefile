.PHONY: deploy deploy-react deploy-vue

deploy: deploy-react deploy-vue

deploy-react:
	-rm -f docs/react/*
	cp url-timer-react/dist/* docs/react/

deploy-vue:
	-rm -f docs/vue/*
	cp url-timer-vue/dist/* docs/vue/
