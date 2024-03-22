import {
  bootstrapModeler,
  getBpmnJS,
  inject
} from 'test/TestHelper';

import { CloudElementTemplatesCoreModule } from 'bpmn-js-element-templates';

import OpenAI from 'openai';

import OpenAIClient from '../../../../../lib/refactorings/providers/open-ai/OpenAIClient';

import handlers from '../../../../../lib/refactorings/providers/open-ai/handlers';

import elementTemplates from '../../../../fixtures/element-templates/all.json';

import diagramXML from '../../../../fixtures/bpmn/simple.bpmn';

const openAIApiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: openAIApiKey,
  dangerouslyAllowBrowser: true
});

const testOpenai = window.__env__ && window.__env__.TEST_OPENAI === 'true';

(testOpenai ? describe : describe.skip)('OpenAIClient', function() {

  this.timeout(10000);

  beforeEach(bootstrapModeler(diagramXML, {
    additionalModules: [
      CloudElementTemplatesCoreModule
    ],
    elementTemplates
  }));

  let openAIClient;

  beforeEach(function() {
    openAIClient = new OpenAIClient({
      createChatCompletion: (...args) => openai.chat.completions.create(...args)
    });
  });


  it('should return tool call', inject(async function(elementRegistry) {

    // given
    const element = elementRegistry.get('Task_1');

    // when
    const toolCalls = await openAIClient.getToolCalls(element, getTools(element));

    // then
    expect(toolCalls).to.have.length(1);
    expect(toolCalls[0].name).to.eql('template_Slack_v1');
  }));

});

function getTools(element) {
  return handlers
    .map(Handler => getBpmnJS().get('injector').instantiate(Handler))
    .filter(handler => handler.canExecute(element))
    .map(handler => {
      return {
        type: 'function',
        function: handler.getFunctionDescription()
      };
    });
}